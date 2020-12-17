# Gnosis Safe Airdrop

Send arbitrarily many distinct tokens, to arbitrarily many distinct accounts with various different values from a CSV file in a single Safe transaciton!

## Using the App

The current version is deployed on IPFS at https://bafybeigq4fta6nzpcgysib7qvravao5px636tbnwuyjbmxmwgy3i3vj55a.ipfs.infura-ipfs.io/

On mainnet or rinkeby, you can navigate to the [Gnosis Safe](https://gnosis-safe.io/app/) Apps tab and load the app from "Add Custom App", then follow these [instructions](./INSTRUCTIONS.md) to perform your first airdrop.

Note that, the mainnet version relies on the (Uniswap Default Token List)[https://tokenlists.org/token-list?url=https://gateway.ipfs.io/ipns/tokens.uniswap.org] for token icons and number of decimal places. If you plan to airdrop a token that is not a member of this list, you will have to provide the number of decimal places as the `decimals` column on each unlisted token transfer in your transfer file.

## Developers Guide

Install dependencies and start a local dev server.

```
yarn install
cp .env.sample .env
yarn start
```

Then:

- If HTTPS is used (by default enabled)
  - Open your Safe app locally (by default via https://localhost:3000/) and accept the SSL error.
- Go to Safe Multisig web interface
  - [Mainnet](https://app.gnosis-safe.io)
  - [Rinkeby](https://rinkeby.gnosis-safe.io/app)
- Create your test safe
- Go to Apps -> Manage Apps -> Add Custom App
- Paste your localhost URL, default is https://localhost:3000/
- You should see Safe App Starter as a new app
- Develop your app from there

## Features

Gnosis Safe App Starter combines recommendations described in the following repositories:

- [Safe Apps SDK](https://github.com/gnosis/safe-apps-sdk)
- [safe-react-components](https://github.com/gnosis/safe-react-components)

You can use the `useSafe` React hook to interact with the Safe Apps SDK

```
const safe = useSafe();
console.log(safe.info);
```

Safe React Components are also integrated and ready to use. [See all components](https://components.gnosis-safe.io/).

## Dependencies

### Included

- [`@gnosis.pm/safe-react-components`](https://github.com/gnosis/safe-react-components) (UI components themed for the Safe Multisig interface)
- [`@rmeissner/safe-apps-react-sdk`](https://github.com/rmeissner/safe-sdks-js/tree/master/safe-apps-react-sdk) (React hook for the Safe Apps SDK)

### Recommended

- [`ethers`](https://github.com/ethers-io/ethers.js) (Library for interacting with Ethereum)
- [`web3`](https://github.com/ethereum/web3.js/) (Library for interacting with Ethereum)
- [`@studydefi/money-legos`](https://github.com/studydefi/money-legos) (Library for DeFi interactions)
