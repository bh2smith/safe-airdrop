import { Text } from "@gnosis.pm/safe-react-components";
import debounce from "lodash.debounce";
import React, { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import { MessageContext } from "../contexts/MessageContextProvider";
import { useBalances } from "../hooks/balances";
import { useCollectibleTokenInfoProvider } from "../hooks/collectibleTokenInfoProvider";
import { useEnsResolver } from "../hooks/ens";
import { useTokenInfoProvider } from "../hooks/token";
import { checkAllBalances } from "../parser/balanceCheck";
import { CSVParser, Transfer } from "../parser/csvParser";

import { CSVEditor } from "./CSVEditor";
import { CSVUpload } from "./CSVUpload";
import { GenerateTransfersMenu } from "./GenerateTransfersMenu";

const Form = styled.div`
  flex: 1;
  flex-direction: column;
  display: flex;
  justify-content: space-around;
  gap: 8px;
`;
export interface CSVFormProps {
  updateTransferTable: (transfers: Transfer[]) => void;
  setParsing: (parsing: boolean) => void;
}

export const CSVForm = (props: CSVFormProps): JSX.Element => {
  const { updateTransferTable, setParsing } = props;
  const [csvText, setCsvText] = useState<string>("token_type,token_address,receiver,amount,id");

  const { setCodeWarnings, setMessages } = useContext(MessageContext);

  const { assetBalance, collectibleBalance } = useBalances();
  const tokenInfoProvider = useTokenInfoProvider();
  const ensResolver = useEnsResolver();
  const erc721TokenInfoProvider = useCollectibleTokenInfoProvider();

  const onChangeTextHandler = (csvText: string) => {
    setCsvText(csvText);
  };

  const parseAndValidateCSV = useMemo(
    () =>
      debounce((csvText: string) => {
        setParsing(true);

        CSVParser.parseCSV(csvText, tokenInfoProvider, erc721TokenInfoProvider, ensResolver)
          .then(async ([transfers, warnings]) => {
            const uniqueReceiversWithoutEnsName = transfers.reduce(
              (previousValue, currentValue): Set<string> =>
                currentValue.receiverEnsName === null ? previousValue.add(currentValue.receiver) : previousValue,
              new Set<string>(),
            );
            if (uniqueReceiversWithoutEnsName.size < 15) {
              transfers = await Promise.all(
                // If there is no ENS Name we will try to lookup the address
                transfers.map(async (transfer) =>
                  transfer.receiverEnsName
                    ? transfer
                    : {
                        ...transfer,
                        receiverEnsName: (await ensResolver.isEnsEnabled())
                          ? await ensResolver.lookupAddress(transfer.receiver)
                          : null,
                      },
                ),
              );
            }
            transfers = transfers.map((transfer, idx) => ({ ...transfer, position: idx + 1 }));
            updateTransferTable(transfers);
            // If we have no balances we dont need to check them.
            if (assetBalance || collectibleBalance) {
              const insufficientBalances = checkAllBalances(assetBalance, collectibleBalance, transfers);
              setMessages(
                insufficientBalances.map((insufficientBalanceInfo) => {
                  if (
                    insufficientBalanceInfo.token_type === "erc20" ||
                    insufficientBalanceInfo.token_type === "native"
                  ) {
                    if (insufficientBalanceInfo.token_type === "native") {
                      insufficientBalanceInfo.token = tokenInfoProvider.getNativeTokenSymbol();
                    }
                    return {
                      message: `Insufficient Balance: ${insufficientBalanceInfo.transferAmount} of ${insufficientBalanceInfo.token}`,
                      severity: "error",
                    };
                  } else {
                    if (insufficientBalanceInfo.isDuplicate) {
                      return {
                        message: `Duplicate transfer for ERC721 token ${insufficientBalanceInfo.token} with ID ${insufficientBalanceInfo.id}`,
                        severity: "warning",
                      };
                    } else {
                      return {
                        message: `Collectible ERC721 token ${insufficientBalanceInfo.token} with ID ${insufficientBalanceInfo.id} is not held by this safe`,
                        severity: "error",
                      };
                    }
                  }
                }),
              );
            }

            setCodeWarnings(warnings);
            setParsing(false);
          })
          .catch((reason: any) => setMessages([{ severity: "error", message: reason.message }]));
      }, 750),
    [
      ensResolver,
      erc721TokenInfoProvider,
      assetBalance,
      collectibleBalance,
      setCodeWarnings,
      setMessages,
      setParsing,
      tokenInfoProvider,
      updateTransferTable,
    ],
  );

  useEffect(() => {
    parseAndValidateCSV(csvText);
  }, [csvText, parseAndValidateCSV]);

  return (
    <Form>
      <Text size="xl">
        Send arbitrarily many distinct tokens, to arbitrarily many distinct accounts with various different values from
        a CSV file in a single transaction.
      </Text>
      <Text size="lg">
        Upload, edit or paste your asset transfer CSV <br /> (token_type,token_address,receiver,amount,id)
      </Text>

      <CSVEditor csvText={csvText} onChange={onChangeTextHandler} />

      <CSVUpload onChange={onChangeTextHandler} />
      <GenerateTransfersMenu
        assetBalance={assetBalance}
        collectibleBalance={collectibleBalance}
        setCsvText={setCsvText}
        csvText={csvText}
      />
    </Form>
  );
};
