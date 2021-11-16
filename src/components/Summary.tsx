import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Dot,
  Icon,
  Text,
  Title,
} from "@gnosis.pm/safe-react-components";

import { AssetTransfer, CollectibleTransfer } from "../parser/csvParser";

import { AssetTransferTable } from "./assets/AssetTransferTable";
import { CollectiblesTransferTable } from "./assets/CollectiblesTransferTable";

type SummaryProps = {
  assetTransfers: AssetTransfer[];
  collectibleTransfers: CollectibleTransfer[];
};

export const Summary = (props: SummaryProps): JSX.Element => {
  const { assetTransfers, collectibleTransfers } = props;
  const assetTxCount = assetTransfers.length;
  const collectibleTxCount = collectibleTransfers.length;
  return (
    <>
      <Title size="md">Summary of transfers</Title>
      <Accordion compact style={{ maxWidth: 1400 }}>
        <AccordionSummary>
          <div
            style={{
              display: "flex",
              gap: "8px",
              width: "100%",
              alignItems: "center",
              justifyContent: "flex-start",
              flexDirection: "row",
            }}
          >
            <Icon size="md" type="assets" />
            <Text size="xl" className="navLabel">
              Assets
            </Text>

            <div style={{ flex: 4 }}>
              {assetTxCount > 0 && (
                <Text size="lg">
                  {assetTxCount} {`transfer${assetTxCount > 1 ? "s" : ""}`}
                </Text>
              )}
            </div>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <AssetTransferTable transferContent={assetTransfers} />
        </AccordionDetails>
      </Accordion>
      <Accordion compact style={{ maxWidth: 1400 }}>
        <AccordionSummary>
          <div
            style={{ display: "flex", gap: "8px", width: "100%", alignItems: "center", justifyContent: "flex-start" }}
          >
            <Icon size="md" type="collectibles" />
            <Text size="xl" className="navLabel">
              Collectibles
            </Text>
            <div style={{ flex: 4 }}>
              {collectibleTxCount > 0 && (
                <Text size="lg">
                  {collectibleTxCount} {`transfer${collectibleTxCount > 1 ? "s" : ""}`}
                </Text>
              )}
            </div>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <CollectiblesTransferTable transferContent={collectibleTransfers} />
        </AccordionDetails>
      </Accordion>
    </>
  );
};
