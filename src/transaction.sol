// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EtherTransfer {
    event TransferSuccessful(address indexed from, address indexed to, uint256 amount);

    
    event TransferFailed(address indexed from, address indexed to, uint256 amount);

    
    function sendEther(address payable recipient) external payable {
        require(msg.value > 0, "You need to send some Ether.");
        require(recipient != address(0), "Invalid recipient address.");

        
        (bool success, ) = recipient.call{value: msg.value}("");
        if (success) {
            emit TransferSuccessful(msg.sender, recipient, msg.value);
        } else {
            emit TransferFailed(msg.sender, recipient, msg.value);
            revert("Transfer failed.");
        }
    }

    
    receive() external payable {}

    
    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}