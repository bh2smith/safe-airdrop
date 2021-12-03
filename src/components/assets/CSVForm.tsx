import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { Text } from "@gnosis.pm/safe-react-components";
import { ethers } from "ethers";
import debounce from "lodash.debounce";
import React, { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import { MessageContext } from "../../contexts/MessageContextProvider";
import { useCollectibleTokenInfoProvider } from "../../hooks/collectibleTokenInfoProvider";
import { useEnsResolver } from "../../hooks/ens";
import { useTokenInfoProvider } from "../../hooks/token";
import { AssetTransfer, CSVParser, Transfer } from "../../parser/csvParser";
import { checkAllBalances, transfersToSummary } from "../../utils";
import { CSVEditor } from "../CSVEditor";
import { CSVUpload } from "../CSVUpload";

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
  const [csvText, setCsvText] = useState<string>("token_type,token_address,receiver,value,id");

  const { setCodeWarnings, setMessages } = useContext(MessageContext);

  const { safe, sdk } = useSafeAppsSDK();
  const web3Provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [safe, sdk]);
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
            const summary = transfersToSummary(
              transfers.filter(
                (value) => value.token_type === "erc20" || value.token_type === "native",
              ) as AssetTransfer[],
            );
            updateTransferTable(transfers);

            checkAllBalances(summary, web3Provider, safe).then((insufficientBalances) =>
              setMessages(
                insufficientBalances.map((insufficientBalanceInfo) => ({
                  message: `Insufficient Balance: ${insufficientBalanceInfo.transferAmount} of ${insufficientBalanceInfo.token}`,
                  severity: "warning",
                })),
              ),
            );
            setCodeWarnings(warnings);
            setParsing(false);
          })
          .catch((reason: any) => setMessages([{ severity: "error", message: reason.message }]));
      }, 750),
    [
      ensResolver,
      erc721TokenInfoProvider,
      safe,
      setCodeWarnings,
      setMessages,
      setParsing,
      tokenInfoProvider,
      updateTransferTable,
      web3Provider,
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
        Upload, edit or paste your asset transfer CSV <br /> (token_type,token_address,receiver,value,id)
      </Text>

      <CSVEditor csvText={csvText} onChange={onChangeTextHandler} />

      <CSVUpload onChange={onChangeTextHandler} />
    </Form>
  );
};
