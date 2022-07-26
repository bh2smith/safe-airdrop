import { Loader, Text } from "@gnosis.pm/safe-react-components";

export const Loading = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        paddingTop: "36px",
      }}
    >
      <Text size={"xl"} strong>
        Loading tokenlist and balances...
      </Text>
      <Loader size={"md"} />
    </div>
  );
};
