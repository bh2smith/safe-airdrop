import styled from "@emotion/styled";
import { Typography } from "@mui/material";
import { EthHashInfo } from "@safe-global/safe-react-components";

import { useTokenList } from "../../hooks/token";

type TokenProps = {
  tokenAddress: string | null;
  symbol?: string;
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

export const ERC20Token = (props: TokenProps) => {
  const { tokenAddress, symbol } = props;
  const { tokenList } = useTokenList();
  return (
    <Container>
      {tokenList.get(tokenAddress) && (
        <img
          alt={""}
          src={tokenList.get(tokenAddress)?.logoURI}
          style={{
            maxWidth: 20,
            marginRight: 3,
            verticalAlign: "middle",
          }}
        />
      )}
      {symbol ? (
        <Typography noWrap>{symbol}</Typography>
      ) : tokenAddress ? (
        <EthHashInfo address={tokenAddress} showAvatar={false} showCopyButton={false} />
      ) : null}
    </Container>
  );
};
