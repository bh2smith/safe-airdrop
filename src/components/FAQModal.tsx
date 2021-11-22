import { Icon, Text, Title, Divider, Button, GenericModal } from "@gnosis.pm/safe-react-components";
import { Fab } from "@material-ui/core";
import { useState } from "react";

export const FAQModal: () => JSX.Element = () => {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <>
      <Fab
        variant="extended"
        size="small"
        style={{ position: "absolute", top: 24, right: 24, textTransform: "none" }}
        onClick={() => setShowHelp(true)}
      >
        <Icon size="md" type="question" />
        <Text size="xl">Help</Text>
      </Fab>
      {showHelp && (
        <GenericModal
          onClose={() => setShowHelp(false)}
          title={<Title size="lg">How to use the CSV Airdrop Gnosis App</Title>}
          body={
            <div>
              <Title size="md" strong>
                Preparing a Transfer File
              </Title>
              <Text size="lg">
                Transfer files are expected to be in CSV format with the following required columns:
                <ul>
                  <li>
                    <code>receiver</code>: Ethereum address of transfer receiver.
                  </li>
                  <li>
                    <code>token_address</code>: Ethereum address of ERC20 token to be transferred.
                  </li>
                  <li>
                    <code>amount</code>: the amount of token to be transferred.
                  </li>
                </ul>
                <p>
                  <b>
                    Important: The CSV file has to use "," as a separator and the header row always has to be provided
                    as the first row and include the described column names.
                  </b>
                </p>
              </Text>
              <Divider />
              <Title size="md" strong>
                Native Token Transfers
              </Title>
              <Text size="lg">
                Since native tokens do not have a token address, you must leave the <code>token_address</code> column
                blank for native transfers.
              </Text>
            </div>
          }
          footer={
            <Button size="md" color="secondary" onClick={() => setShowHelp(false)}>
              Close
            </Button>
          }
        ></GenericModal>
      )}
    </>
  );
};
