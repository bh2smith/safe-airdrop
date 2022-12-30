import { Accordion, AccordionDetails, AccordionSummary, Icon, Text } from "@gnosis.pm/safe-react-components";

import { AssetTransfer, CollectibleTransfer } from "../hooks/useCsvParser";

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
      <Accordion disabled={assetTxCount === 0} compact style={{ maxWidth: 1400 }}>
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
            <Text size="xl" strong className="navLabel">
              Assets
            </Text>

            <div style={{ flex: 4 }}>
              <Text size="lg" strong>
                {`${assetTxCount > 0 ? assetTxCount : "no"} transfer${
                  assetTxCount > 1 || assetTxCount === 0 ? "s" : ""
                }`}
              </Text>
            </div>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          {assetTransfers.length > 0 && <AssetTransferTable transferContent={assetTransfers} />}
        </AccordionDetails>
      </Accordion>
      <Accordion disabled={collectibleTxCount === 0} compact style={{ maxWidth: 1400 }}>
        <AccordionSummary>
          <div
            style={{ display: "flex", gap: "8px", width: "100%", alignItems: "center", justifyContent: "flex-start" }}
          >
            <Icon size="md" type="collectibles" />
            <Text size="xl" strong className="navLabel">
              Collectibles
            </Text>
            <div style={{ flex: 4 }}>
              <Text size="lg" strong>
                {`${collectibleTxCount > 0 ? collectibleTxCount : "no"} transfer${
                  collectibleTxCount > 1 || collectibleTxCount === 0 ? "s" : ""
                }`}
              </Text>
            </div>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          {collectibleTransfers.length > 0 && <CollectiblesTransferTable transferContent={collectibleTransfers} />}
        </AccordionDetails>
      </Accordion>
    </>
  );
};
