# Ethereum Transfer and File Registry dApp

A React single-page app with two MetaMask-based tools: a **Transactions** page that sends ETH from the connected account to any address, and a **Storage** page that records a file's name, keccak-256 hash and size on chain through a `FileStorage` contract. The browser only hashes the file; its contents are not uploaded anywhere. A separate Python script registers files in the same contract from the command line with web3.py, using SHA-256 hashes. Both clients use the same `FileStorage` address, which the script reaches through a Sepolia RPC endpoint.

## How it works

**Front end (`src/`).** React Router maps four routes:

| Route | Component | Behavior |
| --- | --- | --- |
| `/` | `Login.js` | Client-side form that accepts the hard-coded pair `admin` / `password` and navigates to `/home`. |
| `/home` | `Home.js` | Links to the two tools. |
| `/transaction` | `Transaction.js` | Uses web3.js with `window.ethereum` to request accounts, then calls `web3.eth.sendTransaction` with the amount converted by `toWei(amount, 'ether')`. Progress comes from the `transactionHash`, `receipt` and `error` events and is shown as text and react-toastify toasts. The history list lives in component state only. |
| `/storage` | `Storage.js` | Reads the selected file with `FileReader`, hashes the bytes with `web3.utils.sha3` (keccak-256) and calls `uploadFile(name, hash, size)` on `FileStorage` from the connected account with a 2,000,000 gas limit. On load and after each upload it reads `fileCount()`, then `files(i)` for IDs 1 to `fileCount` (the IDs the contract uses), and lists the three newest entries, with sizes shown in bytes, KB or MB by `formatFileSize` in `src/fileUtils.js`. |

**Contracts.**

- `src/storage.sol` (`FileStorage`): `uploadFile` increments `fileCount`, stores `{name, hash, size, uploader: msg.sender}` under the new count (so IDs start at 1) and emits `FileUploaded`. `getFile(id)` and the public `files(id)` getter return a record.
- `src/transaction.sol` (`EtherTransfer`): `sendEther(recipient)` forwards `msg.value` with a low-level call and emits `TransferSuccessful`. If the call fails it reverts with "Transfer failed." There is no failure event, because a revert also undoes any event emitted earlier in the transaction. `receive()` accepts ETH. The constructor stores the deployer as `owner`, and `withdraw()` is guarded by an `onlyOwner` modifier, so only the owner can take out the contract's balance; any other caller gets a revert. A failed withdrawal reverts with "Withdraw failed." No code in this repository calls this contract; the Transactions page sends ETH directly from the wallet.

**Python script (`backend for storage/1.py`).** A standalone script, not a server; the React app does not call it. It connects to Sepolia through the RPC URL in `blockchain_url`, computes the SHA-256 of a local file, then builds and signs an `uploadFile` transaction with a local private key (gas 2,000,000, gas price 20 gwei). It waits for the receipt, prints the metadata of file ID 1 and checks a local file against an expected SHA-256 hash.

## Tech stack

React 18 with React Router 6 and web3.js 4, built with Create React App (react-scripts 5.0.1), react-toastify, MetaMask, Solidity 0.8, Python 3 with web3.py 7, Ethereum Sepolia.

## Run it locally

**Front end.** You need Node.js 22 and MetaMask. From the repository root:

```bash
npm install
npm start
```

The app opens at http://localhost:3000. Sign in with `admin` / `password` and switch MetaMask to Sepolia. To use your own contract, deploy `src/storage.sol` from [Remix](https://remix.ethereum.org) with **Injected Provider - MetaMask** and replace `contractAddress` in `src/Storage.js`.

`npm run build` writes a production build to `build/`, and `npm test` runs the Jest unit tests in `src/`. Dependency versions are pinned in `package.json` and `package-lock.json`.

**Python script.** From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install "web3>=7"
```

`wallet_address` and `private_key` (lines 79 and 80 of `backend for storage/1.py`) are blank in the repository, so the script does not run until you assign them. Use a Sepolia test account with some test ETH and never commit the key. Also replace the file path and expected hash in the `__main__` block, and the RPC URL on line 6 if that endpoint does not respond. Then run:

```bash
python3 "backend for storage/1.py"
```

## Project structure

```
package.json, package-lock.json   dependencies and npm scripts
public/
  index.html                  HTML page the React app mounts into
src/
  index.js, App.js            entry point and routes
  Login.js, Home.js           login form and navigation page
  Transaction.js              ETH transfer page
  Storage.js                  file hash registration page
  fileUtils.js                file size formatting used by Storage.js (tested in fileUtils.test.js)
  storage.sol                 FileStorage contract (used by Storage.js and the script)
  transaction.sol             EtherTransfer contract (not used by the app)
  App.css, index.css          styles
  reportWebVitals.js, setupTests.js, logo.svg   Create React App scaffold files
backend for storage/
  1.py                        web3.py script that registers and verifies files
```

## Limitations and next steps

- The browser hashes with keccak-256 and the script with SHA-256, so a hash recorded by one client cannot be checked by the other.
- The login is a client-side check against hard-coded credentials, and the other routes open directly without it.
- The script needs its key and file paths edited in the source; reading them from environment variables or arguments would be safer.
- Create React App is deprecated. The app still builds with react-scripts 5.0.1 on Node 22, but Vite would be the maintained choice for a rewrite.
