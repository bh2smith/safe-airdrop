import { Text } from "@gnosis.pm/safe-react-components";
import styled from "styled-components";

import { useTokenList } from "../hooks/token";

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
`;

export const Token = (props: TokenProps) => {
  const { tokenAddress, symbol } = props;
  const { tokenList } = useTokenList();
  return (
    <Container>
      <img /* TODO - alt doesn't really work here */
        alt={""}
        src={tokenList.get(tokenAddress)?.logoURI}
        style={{
          maxWidth: 20,
          marginRight: 3,
          verticalAlign: "middle",
        }}
      />{" "}
      <Text size="md">{symbol || tokenAddress}</Text>
    </Container>
  );
};
