import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [status, setStatus] = useState('');
  const [batchId, setBatchId] = useState('');
  const [modelUrl, setModelUrl] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    setFiles([...files, ...acceptedFiles]);
    setPreviews([...previews, ...acceptedFiles.map(file => URL.createObjectURL(file))]);
  }, [files, previews]);

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });

    try {
      const response = await axios.post('https://agy5x3spd5.execute-api.us-east-1.amazonaws.com/dev/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const responseBody = JSON.parse(response.data.body);
      if (responseBody.batchID) {
        setBatchId(responseBody.batchID);
      } else {
        console.error('batchID not found in response');
      }
      setStatus('Upload successful, processing images...');
    } catch (error) {
      setStatus('Error uploading images');
      console.error('Error uploading images:', error);
    }
  };

  useEffect(() => {
    if (batchId) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get('https://agy5x3spd5.execute-api.us-east-1.amazonaws.com/dev/status', {
            params: { batch_id: batchId }
          });
          const responseBody = response.data;
          if (responseBody.status === 'completed') {
            setModelUrl(responseBody.preSignedUrl);
            setStatus('3D model is ready. Click the link to download.');
            clearInterval(interval);
          } else {
            setStatus('Processing...');
          }
        } catch (error) {
          console.error('Error checking status:', error);
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [batchId]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="App">
      <div className="background"></div>
      <header className="App-header">
        <h1 className="title">New freedoms of imagination</h1>
        <p className="subtitle">Dream Machine is an AI model that makes high quality, realistic videos fast from text and images.</p>
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          <p>Drag & drop some files here, or click to select files</p>
        </div>
        <div className="previews">
          {previews.map((preview, index) => (
            <div key={index} className="preview">
              <img src={preview} alt={`preview ${index}`} />
            </div>
          ))}
        </div>
        <button onClick={handleUpload} className="upload-button">Upload</button>
        <div className="status">
          <p>Status: {status}</p>
          {modelUrl && (
            <a href={modelUrl} download>
              DOWNLOAD the MODEL
            </a>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
