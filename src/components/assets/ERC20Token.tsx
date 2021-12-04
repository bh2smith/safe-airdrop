import { Icon, Text } from "@gnosis.pm/safe-react-components";
import styled from "styled-components";

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
  min-width: 285px;
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
      {tokenAddress === null && <Icon size="md" type="eth" />}
      <Text size="md">{symbol || tokenAddress}</Text>
    </Container>
  );
};
