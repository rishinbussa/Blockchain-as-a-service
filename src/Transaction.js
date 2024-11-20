import React, { useState } from 'react';
import Web3 from 'web3';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

function Transaction() {
  const [status, setStatus] = useState('');
  const [transactionHistory, setTransactionHistory] = useState([]); 
  const [isHistoryVisible, setIsHistoryVisible] = useState(false); 

  const handleTransaction = async (recipient, amount) => {
    if (typeof window.ethereum === 'undefined') {
      setStatus("MetaMask is not installed!");
      toast.error("MetaMask is not installed!");  
      return;
    }

    const web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      setStatus("Transaction in progress...");
      toast.info("Transaction in progress...");  

      web3.eth.sendTransaction({
        from: accounts[0],
        to: recipient,
        value: web3.utils.toWei(amount, 'ether')
      })
      .on('transactionHash', (hash) => {
        setStatus(`Transaction sent! Hash: ${hash}`);
        toast.success(`Transaction sent! Hash: ${hash}`);  
        addTransactionToHistory(hash, 'Transaction sent!');
      })
      .on('receipt', (receipt) => {
        
        const simplifiedReceipt = {
          transactionHash: receipt.transactionHash,
          status: 'Transaction successful!'
        };
        setStatus(`Transaction successful! Hash: ${simplifiedReceipt.transactionHash}`);
        toast.success(`Transaction successful! Hash: ${simplifiedReceipt.transactionHash}`);  
        addTransactionToHistory(simplifiedReceipt.transactionHash, simplifiedReceipt.status);
      })
      .on('error', (error) => {
        setStatus(`Error: ${error.message}`);
        toast.error(`Error: ${error.message}`);  
        addTransactionToHistory(null, `Error: ${error.message}`);
      });

      
      toast.info("Transaction started...");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);  
      addTransactionToHistory(null, `Error: ${error.message}`);
    }
  };

  
  const addTransactionToHistory = (hash, status) => {
    setTransactionHistory((prevHistory) => [
      ...prevHistory,
      { hash, status, date: new Date().toLocaleString() },
    ]);
  };

  
  const toggleHistoryVisibility = () => {
    setIsHistoryVisible((prevVisibility) => !prevVisibility);
  };

  return (
    <div style={{ margin: '20px' }}>
      <h2>Transaction</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleTransaction(e.target.recipient.value, e.target.amount.value);
      }}>
        <input
          type="text"
          name="recipient"
          placeholder="Recipient Address"
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px', fontSize: '16px' }}
        />
        <input
          type="text"
          name="amount"
          placeholder="Amount in ETH"
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px', fontSize: '16px' }}
        />
        <button
          type="submit"
          style={{
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            fontSize: '16px', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Send Transaction
        </button>
      </form>
      <p>{status}</p>

      {/* View History Button */}
      <button
        onClick={toggleHistoryVisibility}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {isHistoryVisible ? 'Hide Transaction History' : 'View Transaction History'}
      </button>

      {/* Transaction History */}
      {isHistoryVisible && (
        <div style={{
          marginTop: '20px',
          border: '1px solid #ddd',
          padding: '10px',
          maxHeight: '300px',  
          overflowY: 'auto',  
          backgroundColor: '#f4f4f9',  
          borderRadius: '8px',  
        }}>
          <h3 style={{
            marginBottom: '10px',
            color: '#1A202C', 
            fontSize: '18px',
            fontWeight: 'bold'
          }}>Transaction History</h3>
          <div>
            {transactionHistory.length > 0 ? (
              transactionHistory.map((transaction, index) => (
                <div key={index} style={{
                  marginBottom: '10px',
                  padding: '10px',
                  borderBottom: '1px solid #ccc',
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '8px', 
                }}>
                  <p style={{ color: 'black' }}><strong>Transaction Hash:</strong> {transaction.hash}</p>
                  <p style={{ color: 'black' }}><strong>Status:</strong> {transaction.status}</p>
                  <p style={{ color: 'black' }}><strong>Date:</strong> {transaction.date}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'black' }}>No transactions yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

export default Transaction;