import React, { useState } from 'react';
import LoadingScreen from "./LoadingScreen";
import Notification from './Notification';

const ImageInputForm = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playlistId, setPlaylistId] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', isVisible: false });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData();
    if (imageUrl) {
      formData.append('imageUrl', imageUrl);
    }
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await fetch('http://localhost:4000/api/playlists/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error?.includes('Daily playlist limit reached')) {
          setNotification({
            message: 'Daily playlist limit (10) reached. Please try again tomorrow.',
            isVisible: true
          });
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || 'An error occurred while uploading the image');
      }
      
      setPlaylistId(data.tempId);
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.message?.includes('Daily playlist limit reached')) {
        setNotification({
          message: 'Daily playlist limit (10) reached. Please try again tomorrow.',
          isVisible: true
        });
      } else {
        setError(error.message);
      }
      setIsLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, isVisible: false });
  };

  if (isLoading || playlistId) {
    return (
      <LoadingScreen 
        playlistId={playlistId} 
        onError={(errorMessage) => {
          setError(errorMessage);
          setIsLoading(false);
          setPlaylistId(null);
        }}
        onComplete={(newPlaylistId) => {
          setPlaylistId(newPlaylistId);
          setIsLoading(false);
          setIsComplete(true);
        }}
      />
    );
  }

  if (isComplete) {
    return (
      <LoadingScreen 
        playlistId={playlistId} 
        onError={(errorMessage) => {
          setError(errorMessage);
          setIsComplete(false);
          setPlaylistId(null);
        }}
        onComplete={(newPlaylistId) => {
          // This should not be called again, but just in case
          setPlaylistId(newPlaylistId);
          setIsComplete(true);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Generate Playlist from Image</h2>
      <div>
        <label>Image URL:</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Enter image URL"
        />
      </div>
      <div>
        <label>Upload Image:</label>
        <input type="file" onChange={handleFileChange} />
      </div>
      <button type="submit">Generate Playlist</button>
      {error && <div className="error">{error}</div>}
      <Notification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={handleCloseNotification}
      />
    </form>
  );
};

export default ImageInputForm;