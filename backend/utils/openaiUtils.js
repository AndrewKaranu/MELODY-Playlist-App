const mongoose = require('mongoose');
const User = require('../models/userModel');
const axios = require('axios');
const fs = require('fs');

// Dynamic import for node-fetch
let fetch;

const loadFetch = async () => {
  if (!fetch) {
    fetch = (await import('node-fetch')).default;
  }
};

const processImageUrl = async (imageUrl) => {
  await loadFetch(); // Ensure fetch is loaded
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  return buffer.toString('base64');
};

const processUploadedFile = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString('base64');
};

module.exports = {
  processImageUrl,
  processUploadedFile,
};