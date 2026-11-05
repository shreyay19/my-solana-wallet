# My Solana Wallet

A React-based Solana wallet application built to generate, restore, and manage multiple wallets on the Solana Devnet. The application also supports SOL transfers, token balance checking, and token swaps using Orca Whirlpool.

## Features

- **Generate Wallet:** Create a new Solana wallet with a 12-word recovery phrase.
- **Restore Wallet:** Import an existing wallet using its recovery phrase.
- **Multiple Wallets:** Create and manage multiple wallets derived from the same recovery phrase.
- **Wallet Management:** View wallet addresses and switch between wallets.
- **SOL Balance:** Check the SOL balance of the selected wallet.
- **Token Balances:** View USDC and devUSDC balances.
- **Request Airdrop:** Request free SOL on Solana Devnet for testing.
- **Send SOL:** Transfer SOL from one wallet to another.
- **Orca Swap:** Swap SOL for devUSDC using Orca Whirlpool.
- **Wallet Protection:** Prevent accidental replacement of an existing wallet.

## Technologies Used

- React.js
- Vite
- JavaScript
- CSS
- Solana Web3.js
- Solana SPL Token
- Orca Whirlpools SDK
- BIP39
- ed25519-hd-key
- Decimal.js

## Installation

1. Clone the repository:

   `git clone https://github.com/shreyay19/my-solana-wallet.git`

2. Navigate to the project folder:

   `cd my-solana-wallet`

3. Install dependencies:

   `npm install`

4. Start the development server:

   `npm run dev`

5. Open the local URL displayed in your terminal (usually `http://localhost:5173`).

## Network

- **Blockchain:** Solana
- **Network:** Devnet
- **DEX:** Orca Whirlpool

This project is developed for learning and testing purposes on Solana Devnet. Do not use real funds or store valuable assets in this learning wallet.

## Successful Orca Swap – Solana Devnet

- **Status:** Successful
- **DEX:** Orca Whirlpool
- **Input:** 0.01 SOL
- **Output:** Approximately 0.22 devUSDC
- **Network:** Solana Devnet

**Transaction Signature:**

`23sU4n6xyMgNZ24rk2f5WrMjuHVZF46KDuUGU8wsfvHhbLmRDvm3fph2QGipg6oXD3mpV9ML5XAkFfy15j8V7eAy`

**View Transaction:** [Solana Explorer](https://explorer.solana.com/tx/23sU4n6xyMgNZ24rk2f5WrMjuHVZF46KDuUGU8wsfvHhbLmRDvm3fph2QGipg6oXD3mpV9ML5XAkFfy15j8V7eAy?cluster=devnet)

## Live Deployment

[Open My Solana Wallet](https://my-solana-wallet-theta.vercel.app)

## GitHub Repository

[View Source Code](https://github.com/shreyay19/my-solana-wallet)

## Author

Developed as a Solana wallet development project using React and Solana blockchain technologies.