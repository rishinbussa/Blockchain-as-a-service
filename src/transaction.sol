// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EtherTransfer {
    // The account that deployed the contract. Only it can withdraw.
    address public owner;

    event TransferSuccessful(address indexed from, address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    
    function sendEther(address payable recipient) external payable {
        require(msg.value > 0, "You need to send some Ether.");
        require(recipient != address(0), "Invalid recipient address.");

        
        (bool success, ) = recipient.call{value: msg.value}("");
        // A revert undoes the whole transaction, events included, so a failed
        // transfer is reported through the revert reason rather than an event.
        require(success, "Transfer failed.");
        emit TransferSuccessful(msg.sender, recipient, msg.value);
    }

    
    receive() external payable {}

    
    function withdraw() external onlyOwner {
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Withdraw failed.");
    }
}