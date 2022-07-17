import { Icon, Text, Title, Divider, Button, GenericModal, Link } from "@gnosis.pm/safe-react-components";
import { Fab } from "@material-ui/core";
import { useState } from "react";

export const FAQModal: () => JSX.Element = () => {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <>
      <Fab variant="extended" size="small" style={{ textTransform: "none" }} onClick={() => setShowHelp(true)}>
        <Icon size="md" type="question" />
        <Text size="xl">Help</Text>
      </Fab>
      {showHelp && (
        <GenericModal
          withoutBodyPadding={false}
          onClose={() => setShowHelp(false)}
          title={<Title size="lg">How to use the CSV Airdrop App</Title>}
          body={
            <div>
              <Title size="md" strong>
                Overview
              </Title>
              <Text size="lg">
                <p>
                  This app can batch multiple transfers of ERC20, ERC721, ERC1155 and native tokens into a single
                  transaction. It's as simple as uploading / copy & pasting a single CSV transfer file and hitting the
                  submit button.
                </p>
                <p>
                  {" "}
                  This saves gas ⛽ and a substantial amount of time ⌚ by requiring less signatures and transactions.
                </p>
              </Text>
              <Divider />
              <Title size="md" strong>
                Preparing a Transfer File
              </Title>
              <Text size="lg">
                Transfer files are expected to be in CSV format with the following required columns:
                <ul>
                  <li>
                    <code>
                      <b>token_type</b>
                    </code>
                    : The type of token that is being transferred. One of <code>erc20,nft</code> or <code>native</code>.
                    NFT Tokens can be either ERC721 or ERC1155.
                  </li>
                  <li>
                    <code>
                      <b>token_address</b>
                    </code>
                    : Ethereum address of ERC20 token to be transferred. This has to be left blank for native (ETH)
                    transfers.
                  </li>
                  <li>
                    <code>
                      <b>receiver</b>
                    </code>
                    : Ethereum address of transfer receiver.
                  </li>
                  <li>
                    <code>
                      <b>amount</b>
                    </code>
                    : the amount of token to be transferred. This can be left blank for erc721 transfers.
                  </li>
                  <li>
                    <code>
                      <b>id</b>
                    </code>
                    : The id of the collectible token (erc721 or erc1155) to transfer. This can be left blank for native
                    and erc20 transfers.
                  </li>
                </ul>
                <p>
                  <b>
                    Important: The CSV file has to use "," as a separator and the header row always has to be provided
                    as the first row and include the described column names.
                  </b>
                </p>
              </Text>
              <div>
                <Link href="./sample.csv" download>
                  Sample Transfer File
                </Link>
              </div>
              <Divider />
              <Title size="md" strong>
                Native Token Transfers
              </Title>
              <Text size="lg">
                Since native tokens do not have a token address, you must leave the <code>token_address</code> column
                blank for native transfers.
              </Text>
              <Divider />
              <Title size="md" strong>
                BEP-20 Transfers
              </Title>
              <Text size="lg">
                As the BEP-20 standard is an extension of ERC20 they are supported by this app. Just pass{" "}
                <code>erc20</code> as <code>token_id</code>.
              </Text>
              <Divider />
              <Title size="md" strong>
                Donations
              </Title>
              <Text size="lg">
                You can use the <strong>Donate</strong> Button in the <strong>Generate / Transfers</strong> Menu. This
                will add a transfer to the batch which sends the selected assets to{" "}
                <code>0xD011a7e124181336ED417B737A495745F150d248</code>.
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
