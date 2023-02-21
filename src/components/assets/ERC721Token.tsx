import styled from "@emotion/styled";
import { Box, CircularProgress, Popover, Typography } from "@mui/material";
import { EthHashInfo } from "@safe-global/safe-react-components";
import { BigNumber } from "bignumber.js";
import { useEffect, useState } from "react";

import { CollectibleTokenMetaInfo, useCollectibleTokenInfoProvider } from "../../hooks/collectibleTokenInfoProvider";

type TokenProps = {
  tokenAddress: string;
  id: string;
  token_type: "erc721" | "erc1155";
};

const Container = styled.div`
  flex: 1;
  flex-direction: row;
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
  padding: 16px;
  min-width: 144px;
`;

export const ERC721Token = (props: TokenProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLImageElement | null>(null);

  const [isMetaDataLoading, setIsMetaDataLoading] = useState(false);

  const [tokenMetaData, setTokenMetaData] = useState<CollectibleTokenMetaInfo | undefined>(undefined);

  const collectibleTokenInfoProvider = useCollectibleTokenInfoProvider();

  const { tokenAddress, id, token_type } = props;

  const imageZoomedIn = Boolean(anchorEl);
  useEffect(() => {
    let isMounted = true;
    setIsMetaDataLoading(true);
    collectibleTokenInfoProvider.fetchMetaInfo(tokenAddress, new BigNumber(id), token_type).then((result) => {
      if (isMounted) {
        setTokenMetaData(result);
        setIsMetaDataLoading(false);
      }
    });

    return function callback() {
      isMounted = false;
    };
  }, [collectibleTokenInfoProvider, tokenAddress, id, token_type]);

  return (
    <Container>
      {isMetaDataLoading ? (
        <CircularProgress />
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
                vertical: "top",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
            >
              <Box>
                <img
                  alt={""}
                  src={tokenMetaData?.imageURI}
                  style={{
                    maxWidth: 320,
                    marginRight: 3,
                    verticalAlign: "middle",
                  }}
                />
              </Box>
            </Popover>
          </>
        )
      )}
      {tokenMetaData?.name ? (
        <Typography noWrap>{tokenMetaData.name}</Typography>
      ) : tokenAddress ? (
        <EthHashInfo address={tokenAddress} showAvatar={false} showCopyButton={false} />
      ) : null}
    </Container>
  );
};
