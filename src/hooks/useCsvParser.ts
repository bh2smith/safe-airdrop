import { parseCsv as csvParse } from "multi-asset-transfer";
import { useCallback } from "react";
import { CodeWarning } from "src/stores/slices/messageSlice";

import { useCollectibleTokenInfoProvider } from "./collectibleTokenInfoProvider";
import { useTokenInfoProvider } from "./token";
import { useEnsResolver } from "./useEnsResolver";

export type Transfer = AssetTransfer | CollectibleTransfer;

export type AssetTokenType = "erc20" | "native";
export type CollectibleTokenType = "erc721" | "erc1155";

export interface AssetTransfer {
  token_type: AssetTokenType;
  receiver: string;
  amount: string;
  tokenAddress: string | null;
  decimals: number;
  symbol?: string;
  receiverEnsName: string | null;
  position?: number;
}

export interface CollectibleTransfer {
  token_type: CollectibleTokenType;
  from: string;
  receiver: string;
  tokenAddress: string;
  tokenName?: string;
  tokenId: string;
  amount?: string;
  receiverEnsName: string | null;
}

export interface UnknownTransfer {
  token_type: "unknown";
}

export type CSVRow = {
  token_type?: string;
  token_address: string;
  receiver: string;
  value?: string;
  amount?: string;
  id?: string;
};

export const useCsvParser = (): { parseCsv: (csvText: string) => Promise<[Transfer[], CodeWarning[]]> } => {
  const collectibleTokenInfoProvider = useCollectibleTokenInfoProvider();
  const tokenInfoProvider = useTokenInfoProvider();
  const ensResolver = useEnsResolver();

  const parseCsv = useCallback(
    async (csvText: string): Promise<[Transfer[], CodeWarning[]]> => {
      return csvParse(csvText, tokenInfoProvider, collectibleTokenInfoProvider, ensResolver);
    },
    [collectibleTokenInfoProvider, ensResolver, tokenInfoProvider],
  );

  return {
    parseCsv,
  };
};
