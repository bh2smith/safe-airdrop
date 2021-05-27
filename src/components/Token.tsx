import { useTokenList } from "../hooks/token";

type TokenProps = {
  tokenAddress: string | null;
  symbol?: string;
};

export const Token = (props: TokenProps) => {
  const { tokenAddress, symbol } = props;
  const { tokenList } = useTokenList();
  return (
    <div>
      <img /* TODO - alt doesn't really work here */
        alt={""}
        src={tokenList.get(tokenAddress)?.logoURI}
        style={{
          maxWidth: 20,
          marginRight: 3,
          verticalAlign: "middle",
        }}
      />{" "}
      {symbol || tokenAddress}
    </div>
  );
};
