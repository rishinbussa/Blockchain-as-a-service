from web3 import Web3
import hashlib
import os


blockchain_url = "https://rpc.ankr.com/eth_sepolia"
w3 = Web3(Web3.HTTPProvider(blockchain_url))

if not w3.is_connected():
    print("Failed to connect to the blockchain.")
    exit()


contract_address = Web3.to_checksum_address("0xb9c6361d07e60edd36718451276cd636f24473ff")
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


contract = w3.eth.contract(address=contract_address, abi=contract_abi)

wallet_address = 
private_key = 


def hash_file(file_path):
    with open(file_path, "rb") as file:
        file_data = file.read()
        return hashlib.sha256(file_data).hexdigest()


def upload_file(file_path):
    file_name = os.path.basename(file_path)
    file_hash = hash_file(file_path)
    file_size = os.path.getsize(file_path)

    print(f"Uploading file: {file_name}")
    print(f"File Hash: {file_hash}")
    print(f"File Size: {file_size} bytes")

    
    transaction = contract.functions.uploadFile(file_name, file_hash, file_size).build_transaction({
        "from": wallet_address,
        "nonce": w3.eth.get_transaction_count(wallet_address),
        "gas": 2000000,
        "gasPrice": w3.to_wei("20", "gwei"),
    })

    
    signed_tx = w3.eth.account.sign_transaction(transaction, private_key)

    
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Transaction sent! Tx Hash: {tx_hash.hex()}")

    
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Transaction confirmed! Block Number: {tx_receipt.blockNumber}")


def get_file_metadata(file_id):
    file_details = contract.functions.getFile(file_id).call()
    file_name, file_hash, file_size, uploader = file_details
    print(f"File Name: {file_name}")
    print(f"File Hash: {file_hash}")
    print(f"File Size: {file_size} bytes")
    print(f"Uploader: {uploader}")


def verify_file(file_path, original_hash):
    downloaded_hash = hash_file(file_path)
    return downloaded_hash == original_hash

if __name__ == "__main__":
    
    upload_file("/Users/rishin/Documents/1.rtf")

    
    file_count = contract.functions.fileCount().call()
    if 1 <= file_count:
        get_file_metadata(1)
    else:
        print("Invalid file ID")

    
    is_valid = verify_file("/Users/rishin/Documents/1.rtf", "3cf1b0474bbf98a7ec95a745c8fc98e21a7c387c31b634cd226e9461d4ec1948")
    print(f"File integrity verified: {is_valid}")