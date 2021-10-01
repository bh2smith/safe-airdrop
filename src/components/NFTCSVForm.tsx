import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { Card, Text, Button, Loader } from "@gnosis.pm/safe-react-components";
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
import { CollectiblesTransferTable } from "./assets/CollectiblesTransferTable";

const Form = styled.div`
  flex: 1;
  flex-direction: column;
  display: flex;
  justify-content: space-around;
  gap: 8px;
`;

export interface CSVFormProps {}

export const NFTCSVForm = (props: CSVFormProps): JSX.Element => {
  const [parsing, setParsing] = useState(false);
  const [transferContent, setTransferContent] = useState<CollectibleTransfer[]>([]);
  const [csvText, setCsvText] = useState<string>("token_address,receiver,amount");
  const [submitting, setSubmitting] = useState(false);

  const { setCodeWarnings, setMessages } = useContext(MessageContext);

  const { sdk } = useSafeAppsSDK();
  const erc721InfoProvider = useERC721InfoProvider();
  const ensResolver = useEnsResolver();

  const submitTx = useCallback(async () => {
    setSubmitting(true);
    try {
      const txs = buildERC721Transfers(transferContent);
      console.log(`Encoded ${txs.length} ERC20 transfers.`);
      const sendTxResponse = await sdk.txs.send({ txs });
      const safeTx = await sdk.txs.getBySafeTxHash(sendTxResponse.safeTxHash);
      console.log({ safeTx });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [transferContent, sdk.txs]);

  const onChangeTextHandler = (csvText: string) => {
    setCsvText(csvText);
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
            setTransferContent(transfers);
            setCodeWarnings(warnings);
            setParsing(false);
          })
          .catch((reason: any) => setMessages([{ severity: "error", message: reason.message }]));
      }, 1000),
    [ensResolver, erc721InfoProvider, setCodeWarnings, setMessages],
  );

  return (
    <Card className="cardWithCustomShadow">
      <Form>
        <Text size="xl">
          Send arbitrarily many distinct NFTs, to arbitrarily many distinct accounts from a CSV file in a single
          transaction.
        </Text>
        <Text size="lg">
          Upload, edit or paste your NFT transfer CSV <br /> (nft_address,id,receiver)
        </Text>

        <CSVEditor csvText={csvText} onChange={onChangeTextHandler} />

        <CSVUpload onChange={onChangeTextHandler} />

        {transferContent.length > 0 && <CollectiblesTransferTable transferContent={transferContent} />}

        {submitting ? (
          <>
            <Loader size="md" />
            <br />
            <Button size="lg" color="secondary" onClick={() => setSubmitting(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button
            style={{ alignSelf: "flex-start" }}
            size="lg"
            color="primary"
            onClick={submitTx}
            disabled={parsing || transferContent.length === 0}
          >
            {parsing ? <Loader size="sm" color="primaryLight" /> : "Submit"}
          </Button>
        )}
      </Form>
    </Card>
  );
};
