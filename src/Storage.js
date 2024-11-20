import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [viewFiles, setViewFiles] = useState(false); 
  const [uploadingFileName, setUploadingFileName] = useState(''); 

  const web3 = new Web3(window.ethereum); 

  const contractAddress = "0xb9c6361d07e60edd36718451276cd636f24473ff"; 
  const contractABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "fileId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "hash",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "size",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        }
      ],
      "name": "FileUploaded",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_hash",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_size",
          "type": "uint256"
        }
      ],
      "name": "uploadFile",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "fileCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "files",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "hash",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "size",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const contract = new web3.eth.Contract(contractABI, contractAddress);

  
  const fetchUploadedFiles = async () => {
    try {
      const fileCount = await contract.methods.fileCount().call();
      const files = [];
      for (let i = 0; i < fileCount; i++) {
        const file = await contract.methods.files(i).call();
        files.push(file);
      }

      
      const latestFiles = files.reverse().slice(0, 3);

      
      setUploadedFiles(latestFiles);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  useEffect(() => {
    
    fetchUploadedFiles();

    
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [file]); 

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setUploadingFileName(event.target.files[0].name); 
  };

  const uploadFile = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onloadend = async () => {
      const fileData = fileReader.result;
      const uint8Array = new Uint8Array(fileData); 
      const fileHash = web3.utils.sha3(uint8Array); 
      const fileSize = file.size;
      const fileName = file.name;

      
      const newFile = {
        name: fileName,
        hash: fileHash,
        size: fileSize,
        uploader: "Pending",
      };

     
      setUploadedFiles([newFile, ...uploadedFiles]);

      try {
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];

        
        const tx = await contract.methods.uploadFile(fileName, fileHash, fileSize).send({
          from: account,
          gas: 2000000
        });

        toast.success("File uploaded successfully!");
        toast.info(`Transaction Hash: ${tx.transactionHash}`);

       
        setFile(null);
        setUploadingFileName(''); 
        fetchUploadedFiles(); 
      } catch (err) {
        toast.error("Error uploading file: " + err.message);
        setUploadingFileName(''); 
      }
    };
  };

  return (
    <div>
      <h2>Upload File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadFile}>Upload</button>

      
      {uploadingFileName && (
        <div style={{ padding: '10px', marginTop: '10px', backgroundColor: '#f4f4f4', borderRadius: '8px' }}>
          <strong>Uploading:</strong> {uploadingFileName}
        </div>
      )}

      {/* Button to toggle the view of uploaded files */}
      <button onClick={() => setViewFiles(!viewFiles)}>
        {viewFiles ? "Hide Uploaded Files" : "View Uploaded Files"}
      </button>

      {viewFiles && (
        <div
          style={{
            maxHeight: windowHeight * 0.4, 
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '10px',
            marginTop: '10px',
            marginBottom: '20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
          }}
        >
          <h3>Uploaded Files</h3>
          <ul>
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file, index) => (
                <li key={index} style={{ color: 'black' }}> 
                  <p><strong>File Name:</strong> {file.name}</p>
                  <p><strong>File Hash:</strong> {file.hash}</p>
                  <p><strong>Size:</strong> {web3.utils.fromWei(file.size, 'ether')} ETH</p>
                  <p><strong>Uploader:</strong> {file.uploader}</p>
                </li>
              ))
            ) : (
              <p>No files uploaded yet.</p>
            )}
          </ul>
        </div>
      )}

      {/* Toast Container to display notifications */}
      <ToastContainer />
    </div>
  );
};

export default FileUpload;