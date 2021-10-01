import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { Card, Text } from "@gnosis.pm/safe-react-components";
import debounce from "lodash.debounce";
import React, { useCallback, useContext, useMemo, useState } from "react";
import styled from "styled-components";

import { buildERC721Transfers } from "..//transfers/transfers";
import { CollectiblesParser, CollectibleTransfer } from "../collectiblesParser";
import { MessageContext } from "../contexts/MessageContextProvider";
import { useEnsResolver } from "../hooks/ens";
import { useERC721InfoProvider } from "../hooks/erc721InfoProvider";

import { CSVEditor } from "./CSVEditor";
import { CSVUpload } from "./CSVUpload";

const Form = styled.div`
  flex: 1;
  flex-direction: column;
  display: flex;
  justify-content: space-around;
  gap: 8px;
`;

export interface CSVFormProps {
  updateTxCount: (number) => void;
  updateCsvContent: (string) => void;
  csvContent: string;
  updateTransferTable: (transfers: CollectibleTransfer[]) => void;
  setParsing: (parsing: boolean) => void;
}

export const NFTCSVForm = (props: CSVFormProps): JSX.Element => {
  const { updateTxCount, csvContent, updateCsvContent, updateTransferTable, setParsing } = props;
  const [csvText, setCsvText] = useState<string>(csvContent);

  const { setCodeWarnings, setMessages } = useContext(MessageContext);

  const erc721InfoProvider = useERC721InfoProvider();
  const ensResolver = useEnsResolver();

  const onChangeTextHandler = (csvText: string) => {
    setCsvText(csvText);
    updateCsvContent(csvText);
    parseAndValidateCSV(csvText);
  };

  const parseAndValidateCSV = useMemo(
    () =>
      debounce((csvText: string) => {
        setParsing(true);
        const parsePromise = CollectiblesParser.parseCSV(csvText, erc721InfoProvider, ensResolver);
        parsePromise
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
            // TODO Check Balances
            updateTransferTable(transfers);
            setCodeWarnings(warnings);
            updateTxCount(transfers.length);
            setParsing(false);
          })
          .catch((reason: any) => setMessages([{ severity: "error", message: reason.message }]));
      }, 1000),
    [ensResolver, erc721InfoProvider, setCodeWarnings, setMessages, setParsing, updateTransferTable, updateTxCount],
  );

  return (
    <Card className="cardWithCustomShadow">
      <Form>
        <Text size="xl">
          Send arbitrarily many distinct NFTs, to arbitrarily many distinct accounts from a CSV file in a single
          transaction.
        </Text>
        <Text size="lg">
          Upload, edit or paste your NFT transfer CSV <br /> (token_address,tokenId,receiver)
        </Text>

        <CSVEditor csvText={csvText} onChange={onChangeTextHandler} />

        <CSVUpload onChange={onChangeTextHandler} />
      </Form>
    </Card>
  );
};
