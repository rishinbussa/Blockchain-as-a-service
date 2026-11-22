# Ethereum Transfer and File Registry dApp

A React single-page app with two MetaMask-based tools: a **Transactions** page that sends ETH from the connected account to any address, and a **Storage** page that records a file's name, SHA-256 hash and size on chain through a `FileStorage` contract. The browser only hashes the file; its contents are not uploaded anywhere. A separate Python script registers files in the same contract from the command line with web3.py. Both clients store the hash in the same format (lowercase hex SHA-256 without `0x`), so a file registered by one can be checked by the other. Both talk to the same `FileStorage` contract on Sepolia: the page has its address in `src/Storage.js`, and the script takes the address and an RPC URL as command-line arguments.

## How it works

**Front end (`src/`).** React Router maps four routes:

| Route | Component | Behavior |
| --- | --- | --- |
| `/` | `Login.js` | Demo sign-in screen with no real authentication, and the page says so. It compares the input with the hard-coded pair `admin` / `password` in the browser and navigates to `/home`. The other routes are not guarded and open directly. |
| `/home` | `Home.js` | Links to the two tools. |
| `/transaction` | `Transaction.js` | Uses web3.js with `window.ethereum` to request accounts, then calls `web3.eth.sendTransaction` with the amount converted by `toWei(amount, 'ether')`. Progress comes from the `transactionHash`, `receipt` and `error` events and is shown as text and react-toastify toasts. The history list lives in component state only. |
| `/storage` | `Storage.js` | Reads the selected file with `FileReader`, hashes the bytes with SHA-256 through the browser's Web Crypto API (`sha256Hex` in `src/fileUtils.js`, which calls `crypto.subtle.digest`) and calls `uploadFile(name, hash, size)` on `FileStorage` from the connected account with a 2,000,000 gas limit. On load and after each upload it reads `fileCount()`, then `files(i)` for IDs 1 to `fileCount` (the IDs the contract uses), and lists the three newest entries, with sizes shown in bytes, KB or MB by `formatFileSize` in `src/fileUtils.js`. |

**Contracts.**

- `src/storage.sol` (`FileStorage`): `uploadFile` increments `fileCount`, stores `{name, hash, size, uploader: msg.sender}` under the new count (so IDs start at 1) and emits `FileUploaded`. `getFile(id)` and the public `files(id)` getter return a record.
- `src/transaction.sol` (`EtherTransfer`): `sendEther(recipient)` forwards `msg.value` with a low-level call and emits `TransferSuccessful`. If the call fails it reverts with "Transfer failed." There is no failure event, because a revert also undoes any event emitted earlier in the transaction. `receive()` accepts ETH. The constructor stores the deployer as `owner`, and `withdraw()` is guarded by an `onlyOwner` modifier, so only the owner can take out the contract's balance; any other caller gets a revert. A failed withdrawal reverts with "Withdraw failed." No code in this repository calls this contract; the Transactions page sends ETH directly from the wallet.

**Python script (`scripts/register_file.py`).** A standalone command-line script, not a server; the React app does not call it. It takes the file path, `--rpc-url` and `--contract` as arguments and reads the signing key from the `PRIVATE_KEY` environment variable. It computes the file's SHA-256, then builds, signs and sends an `uploadFile` transaction (web3.py fills in the gas limit and fees). Once the receipt arrives, it takes the new file ID from the `FileUploaded` event in that receipt, reads the record back and checks the stored hash against the file. With `--verify FILE_ID` it sends nothing and only checks the file against an existing record, which also works for files registered from the browser.

## Tech stack

React 18 with React Router 6 and web3.js 4, built with Create React App (react-scripts 5.0.1), react-toastify, MetaMask, Solidity 0.8, Python 3 with web3.py 7, Ethereum Sepolia. Tests use Hardhat 2 with ethers 6, Mocha and Chai for the contracts, and Jest for the front end.

## Run it locally

**Front end.** You need Node.js 22 and MetaMask. From the repository root:

```bash
npm install
npm start
```

The app opens at http://localhost:3000. Browsers only expose the Web Crypto API on `https` pages and `localhost`, so open it through one of those. Sign in on the demo screen with `admin` / `password` and switch MetaMask to Sepolia. To use your own contract, deploy `src/storage.sol` from [Remix](https://remix.ethereum.org) with **Injected Provider - MetaMask** and replace `contractAddress` in `src/Storage.js`.

`npm run build` writes a production build to `build/`. Dependency versions are pinned in `package.json` and `package-lock.json`.

**Python script.** From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
```

Register a file. This sends a transaction, so `PRIVATE_KEY` must be the key of a Sepolia test account with some test ETH. Set it in your shell and never commit it.

```bash
export PRIVATE_KEY=0x...
python3 scripts/register_file.py path/to/file --rpc-url https://YOUR_SEPOLIA_RPC_URL --contract 0xb9c6361d07e60edd36718451276cd636f24473ff
```

Check a file against an existing record without sending a transaction (no key needed). The script exits with status 1 if the hashes differ.

```bash
python3 scripts/register_file.py path/to/file --rpc-url https://YOUR_SEPOLIA_RPC_URL --contract 0xb9c6361d07e60edd36718451276cd636f24473ff --verify 3
```

## Tests

```bash
npm run test:contracts   # Hardhat tests for both contracts (test/)
npm test                 # Jest unit tests for the front end (src/*.test.js)
```

The contract tests deploy `EtherTransfer` and `FileStorage` on Hardhat's in-process network. They check that only the owner can withdraw, that a failed transfer reverts with "Transfer failed.", that file IDs start at 1 and that `fileCount` matches the number of uploads. Hardhat compiles the contracts with the `solc` 0.8.30 package from npm (`hardhat.config.js` points it there instead of downloading a compiler), and `npm run compile` runs only that step. The Jest tests cover the file size formatting and check that the browser's SHA-256 helper returns the same hex string as Python's `hashlib`.

## Project structure

```
package.json, package-lock.json   dependencies and npm scripts
hardhat.config.js             Hardhat settings (contracts in src/, solc from npm)
test/
  EtherTransfer.test.js       contract tests for transaction.sol
  FileStorage.test.js         contract tests for storage.sol
public/
  index.html                  HTML page the React app mounts into
src/
  index.js, App.js            entry point and routes
  Login.js, Home.js           login form and navigation page
  Transaction.js              ETH transfer page
  Storage.js                  file hash registration page
  fileUtils.js                file size formatting and SHA-256 hashing for Storage.js (tested in fileUtils.test.js)
  storage.sol                 FileStorage contract (used by Storage.js and the script)
  transaction.sol             EtherTransfer contract (not used by the app)
  App.css, index.css          styles
  reportWebVitals.js, setupTests.js, logo.svg   Create React App scaffold files
scripts/
  register_file.py            web3.py script that registers and verifies files
  requirements.txt            pinned web3.py version for the script
```

## Limitations and next steps

- Records that the browser stored before it switched to SHA-256 hold a `0x`-prefixed keccak-256 hash, so they do not match a SHA-256 check.
- There is no real authentication. The login screen is a labelled demo that checks hard-coded credentials in the browser, and the other routes open without it. Protecting the pages would need a server, or a wallet signature checked by one.
- Create React App is deprecated. The app still builds with react-scripts 5.0.1 on Node 22, but Vite would be the maintained choice for a rewrite.
