import React, { useState } from 'react';

const ImageInputForm = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      console.log(data);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

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
    </form>
  );
};

export default ImageInputForm;