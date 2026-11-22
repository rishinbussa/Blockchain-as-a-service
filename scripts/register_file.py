"""Register a file's SHA-256 hash in the FileStorage contract, or check a file
against a record that is already stored.

Register a file (sends a transaction paid for by the PRIVATE_KEY account):

    export PRIVATE_KEY=0x...
    python3 scripts/register_file.py notes.pdf --rpc-url URL --contract ADDRESS

Check a file against stored record 3 (read only, no key needed):

    python3 scripts/register_file.py notes.pdf --rpc-url URL --contract ADDRESS --verify 3
"""
import argparse
import hashlib
import os
import sys

from web3 import Web3


contract_abi = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": False, "internalType": "uint256", "name": "fileId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "name", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "hash", "type": "string"},
            {"indexed": False, "internalType": "uint256", "name": "size", "type": "uint256"},
            {"indexed": False, "internalType": "address", "name": "uploader", "type": "address"}
        ],
        "name": "FileUploaded",
        "type": "event"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_name", "type": "string"},
            {"internalType": "string", "name": "_hash", "type": "string"},
            {"internalType": "uint256", "name": "_size", "type": "uint256"}
        ],
        "name": "uploadFile",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "fileCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "name": "files",
        "outputs": [
            {"internalType": "string", "name": "name", "type": "string"},
            {"internalType": "string", "name": "hash", "type": "string"},
            {"internalType": "uint256", "name": "size", "type": "uint256"},
            {"internalType": "address", "name": "uploader", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_fileId", "type": "uint256"}
        ],
        "name": "getFile",
        "outputs": [
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "address", "name": "", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]


def hash_file(file_path):
    # Lowercase hex without 0x, the same format the Storage page stores.
    with open(file_path, "rb") as file:
        file_data = file.read()
        return hashlib.sha256(file_data).hexdigest()


def upload_file(w3, contract, account, file_path):
    file_name = os.path.basename(file_path)
    file_hash = hash_file(file_path)
    file_size = os.path.getsize(file_path)

    print(f"Uploading file: {file_name}")
    print(f"File Hash: {file_hash}")
    print(f"File Size: {file_size} bytes")

    # web3.py fills in the chain ID, gas limit and fees from the node.
    transaction = contract.functions.uploadFile(file_name, file_hash, file_size).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
    })

    signed_tx = account.sign_transaction(transaction)

    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Transaction sent! Tx Hash: {w3.to_hex(tx_hash)}")

    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if tx_receipt.status != 1:
        sys.exit("The transaction failed.")
    print(f"Transaction confirmed! Block Number: {tx_receipt.blockNumber}")

    # The contract chooses the ID, so read it from the FileUploaded event
    # in the receipt instead of guessing.
    event = contract.events.FileUploaded().process_receipt(tx_receipt)[0]
    return event["args"]["fileId"]


def get_file_metadata(contract, file_id):
    file_details = contract.functions.getFile(file_id).call()
    file_name, file_hash, file_size, uploader = file_details
    print(f"File ID: {file_id}")
    print(f"File Name: {file_name}")
    print(f"File Hash: {file_hash}")
    print(f"File Size: {file_size} bytes")
    print(f"Uploader: {uploader}")
    return file_hash


def verify_file(file_path, original_hash):
    downloaded_hash = hash_file(file_path)
    return downloaded_hash == original_hash


def main():
    parser = argparse.ArgumentParser(
        description="Register a file's SHA-256 hash in the FileStorage contract, "
                    "or check a file against a stored record."
    )
    parser.add_argument("file", help="path of the file to register or check")
    parser.add_argument("--rpc-url", required=True, help="JSON-RPC URL of the network, for example a Sepolia endpoint")
    parser.add_argument("--contract", required=True, help="address of the deployed FileStorage contract")
    parser.add_argument("--verify", type=int, metavar="FILE_ID",
                        help="check the file against the record with this ID instead of registering it")
    args = parser.parse_args()

    w3 = Web3(Web3.HTTPProvider(args.rpc_url))
    if not w3.is_connected():
        sys.exit("Failed to connect to the blockchain.")

    contract = w3.eth.contract(address=Web3.to_checksum_address(args.contract), abi=contract_abi)

    if args.verify is not None:
        file_id = args.verify
        file_count = contract.functions.fileCount().call()
        if not 1 <= file_id <= file_count:
            sys.exit(f"No file with ID {file_id}. The contract holds {file_count} file(s), numbered from 1.")
    else:
        private_key = os.environ.get("PRIVATE_KEY")
        if not private_key:
            sys.exit("Set the PRIVATE_KEY environment variable to the key of the account that pays for the upload.")
        account = w3.eth.account.from_key(private_key)
        file_id = upload_file(w3, contract, account, args.file)

    stored_hash = get_file_metadata(contract, file_id)
    is_valid = verify_file(args.file, stored_hash)
    print(f"File integrity verified: {is_valid}")
    if not is_valid:
        sys.exit(1)


if __name__ == "__main__":
    main()
