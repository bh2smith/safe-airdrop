import { Loader, Text } from "@gnosis.pm/safe-react-components";
import { Popover } from "@material-ui/core";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { CollectibleTokenMetaInfo, useCollectibleTokenInfoProvider } from "../../hooks/collectibleTokenInfoProvider";

type TokenProps = {
  tokenAddress: string;
  id: BigNumber;
  token_type: "erc721" | "erc1155";
  hasMetaData: boolean;
};

const Container = styled.div`
  flex: 1;
  flex-direction: row;
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
  padding: 16px;
  min-width: 285px;
`;

export const ERC721Token = (props: TokenProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLImageElement | null>(null);

  const [isMetaDataLoading, setIsMetaDataLoading] = useState(false);

  const [tokenMetaData, setTokenMetaData] = useState<CollectibleTokenMetaInfo | undefined>(undefined);

  const collectibleTokenInfoProvider = useCollectibleTokenInfoProvider();

  const { tokenAddress, id, token_type, hasMetaData } = props;

  const imageZoomedIn = Boolean(anchorEl);
  useEffect(() => {
    let isMounted = true;
    if (hasMetaData) {
      setIsMetaDataLoading(true);
      collectibleTokenInfoProvider.fetchMetaInfo(tokenAddress, id, token_type).then((result) => {
        if (isMounted) {
          setTokenMetaData(result);
          setIsMetaDataLoading(false);
        }
      });
    }
    return function callback() {
      isMounted = false;
    };
  }, [hasMetaData, collectibleTokenInfoProvider, tokenAddress, id, token_type]);

  return (
    <Container>
      {isMetaDataLoading ? (
        <Loader size="sm" />
      ) : (
        tokenMetaData?.imageURI && (
          <>
            <img
              alt={""}
              src={tokenMetaData?.imageURI}
              onClick={(event) => {
                setAnchorEl(event.currentTarget);
              }}
              style={{
                maxWidth: 20,
                marginRight: 3,
                verticalAlign: "middle",
                cursor: "pointer",
              }}
            />{" "}
            <Popover
              style={{ padding: 8 }}
              anchorEl={anchorEl}
              open={imageZoomedIn}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
            >
              <img
                alt={""}
                src={tokenMetaData?.imageURI}
                style={{
                  maxWidth: 320,
                  marginRight: 3,
                  verticalAlign: "middle",
                }}
              />{" "}
            </Popover>
          </>
        )
      )}
      <Text size="md">{tokenMetaData?.name || tokenAddress}</Text>
    </Container>
  );
};
