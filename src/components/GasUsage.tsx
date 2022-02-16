import { BaseTransaction, SafeInfo } from "@gnosis.pm/safe-apps-sdk";
import { Text, Title } from "@gnosis.pm/safe-react-components";
import BigNumber from "bignumber.js";
import React from "react";
import { AssetTransfer, CollectibleTransfer } from "src/parser/csvParser";
import { buildAssetTransfers, buildCollectibleTransfers } from "src/transfers/transfers";

const CIRCLE_RADIUS = 34;
const CIRCLE_DIAMETER = CIRCLE_RADIUS * 2;
const CIRCUMFERENCE = CIRCLE_RADIUS * 2 * Math.PI;
const STROKE_WIDTH = 4;

// TODO: These are just very rough by looking at 2 TX each on etherscan
const NATIVE_ESTIMATION = new BigNumber(21_000);
const ERC20_ESTIMATION = new BigNumber(60_000);
const ERC721_ESTIMATION = new BigNumber(200_000);
const ERC1155_ESTIMATION = new BigNumber(100_000);
const COST_PER_OWNER = new BigNumber(7_000);
const BASE_COST = new BigNumber(21_000);
const DATA_NULL_BYTE_COST = 4;
const DATA_NON_NULL_BYTE_COST = 16;

interface GasUsageProperties {
  assetTransfers: AssetTransfer[];
  collectibleTransfers: CollectibleTransfer[];
  blockGasLimit: BigNumber;
  safe: SafeInfo;
}

/**
 * Component which estimates the transaction gas limit and computes the percentage of block gas limit used.
 *
 * This is displayed as small circle diagram. When more than 60% of the network's block gas limit is used the circle turns red.
 *
 *
 * We estimate quite roughly as described here:
 * https://help.gnosis-safe.io/en/articles/4933491-gas-estimation
 *
 * Although the execution costs are based on pessimistic estimations for each transfer type.
 */
export const GasUsage = (props: GasUsageProperties): JSX.Element => {
  const { assetTransfers, collectibleTransfers, blockGasLimit, safe } = props;

  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const showDetails = (event: React.MouseEvent<HTMLElement>) => {
    setDetailsOpen(true);
  };

  const hideDetails = (event: React.MouseEvent<HTMLElement>) => {
    setDetailsOpen(false);
  };

  const sigCheckTotal = COST_PER_OWNER.times(safe.threshold);
  const txs: BaseTransaction[] = [];
  txs.push(...buildAssetTransfers(assetTransfers));
  txs.push(...buildCollectibleTransfers(collectibleTransfers));
  const dataTotal = txs.reduce(
    (prev, curr) =>
      prev.plus(
        curr.data
          .substr(2)
          .split("")
          .reduce(
            (prev, curr) => (curr === "0" ? prev.plus(DATA_NULL_BYTE_COST) : prev.plus(DATA_NON_NULL_BYTE_COST)),
            new BigNumber(0),
          ),
      ),
    new BigNumber(0),
  );
  const erc20Total = ERC20_ESTIMATION.times(assetTransfers.filter((value) => value.tokenAddress !== null).length);
  const nativeTotal = NATIVE_ESTIMATION.times(assetTransfers.filter((value) => value.tokenAddress === null).length);
  const erc721Total = ERC721_ESTIMATION.times(
    collectibleTransfers.filter((value) => value.token_type === "erc721").length,
  );
  const erc1155Total = ERC1155_ESTIMATION.times(
    collectibleTransfers.filter((value) => value.token_type === "erc1155").length,
  );

  const txExecutionTotal = erc20Total.plus(nativeTotal).plus(erc721Total).plus(erc1155Total);

  const totalGasUsed = txExecutionTotal.plus(sigCheckTotal).plus(dataTotal).plus(BASE_COST);

  const percentageUsed = totalGasUsed.dividedBy(blockGasLimit).times(100);
  const percentageUsedRounded = percentageUsed.decimalPlaces(2).toNumber();

  const strokeColor = percentageUsedRounded < 60 ? "#001428" : "#DB3A3D";

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div>
          <Title size="xs">Block gas limit</Title>
        </div>
        <div onMouseEnter={showDetails} onMouseLeave={hideDetails} style={{ display: "flex", flexDirection: "row" }}>
          <div
            style={{
              border: `${STROKE_WIDTH}px solid #d2d2d1`,
              borderRadius: 999,
              background: "#fff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              aspectRatio: "1/1",
              height: CIRCLE_DIAMETER + STROKE_WIDTH,
              width: CIRCLE_DIAMETER + STROKE_WIDTH,
              boxSizing: "border-box",
              zIndex: 4,
            }}
          >
            <svg
              viewBox={`0 0 ${CIRCLE_DIAMETER + STROKE_WIDTH} ${CIRCLE_DIAMETER + STROKE_WIDTH}`}
              width={CIRCLE_DIAMETER + STROKE_WIDTH}
              height={CIRCLE_DIAMETER + STROKE_WIDTH}
              style={{ position: "absolute" }}
            >
              <circle
                stroke={strokeColor}
                stroke-width={STROKE_WIDTH}
                fill="transparent"
                r={CIRCLE_RADIUS}
                cx={CIRCLE_RADIUS + STROKE_WIDTH / 2}
                cy={CIRCLE_RADIUS + STROKE_WIDTH / 2}
                style={{
                  strokeDasharray: `${CIRCUMFERENCE} ${CIRCUMFERENCE}`,
                  strokeDashoffset: CIRCUMFERENCE - (Math.min(100, percentageUsedRounded) / 100) * CIRCUMFERENCE,
                  transition: "stroke-dashoffset .35s, stroke .35s",
                  transform: "rotate(-90deg)",
                  transformOrigin: "50% 50%",
                }}
              />
            </svg>
            <div>
              <Text size="sm" strong>
                {percentageUsedRounded} %
              </Text>
            </div>
            <Text size="sm">used</Text>
          </div>
          <div
            style={{
              backgroundColor: "#f0efee",
              borderStartEndRadius: 999,
              borderEndEndRadius: 999,
              height: CIRCLE_DIAMETER + STROKE_WIDTH,
              width: detailsOpen ? 400 : 0,
              left: (-1 * (CIRCLE_DIAMETER + STROKE_WIDTH)) / 2,
              paddingLeft: 16 + (CIRCLE_DIAMETER + STROKE_WIDTH) / 2,
              position: "relative",
              overflow: "hidden",
              display: "grid",
              opacity: detailsOpen ? 1 : 0,
              gridTemplateColumns: "3fr 3fr",
              transition: "width .35s, opacity .75s",
            }}
          >
            <Text size="sm">Base tx</Text>
            <Text size="sm">{BASE_COST.toFixed()}</Text>
            <Text size="sm">Data costs</Text>
            <Text size="sm">{dataTotal.toFixed()}</Text>
            <Text size="sm">Signature check</Text>
            <Text size="sm">{sigCheckTotal.toFixed()}</Text>
            <Text size="sm">Estimated tx execution</Text>
            <Text size="sm">{txExecutionTotal.toFixed()}</Text>
            <Text size="sm" strong>
              Total
            </Text>
            <Text size="sm" strong>
              {totalGasUsed.toFixed()}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
