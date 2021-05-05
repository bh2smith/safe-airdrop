# Gnosis Safe: CSV Airdrop

Send arbitrarily many distinct tokens, to arbitrarily many distinct accounts with various different values from a CSV file in a single Safe transaction!

## Using the App

The current version is deployed on IPFS at
https://cloudflare-ipfs.com/ipfs/QmcKRH7ETtdMmuU44zeMYz9ERCdMFevz13SvBPxUhdhT12

On mainnet or rinkeby, you can navigate to the [Gnosis Safe](https://gnosis-safe.io/app/) Apps tab and load the app from "Add Custom App", then follow these [instructions](./INSTRUCTIONS.md) to perform your first airdrop.

Note that, the mainnet version relies on the [Uniswap Default Token List](https://tokenlists.org/token-list?url=https://gateway.ipfs.io/ipns/tokens.uniswap.org) for token icons and number of decimal places. If you plan to airdrop a token that is not a member of this list, you will have to provide the number of decimal places as the `decimals` column on each unlisted token transfer in your transfer file.

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
- You should see Safe Airdrop as a new app
- Develop your features from there
