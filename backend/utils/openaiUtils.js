const mongoose = require('mongoose');
const User = require('../models/userModel');
const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');

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
  const base64String = Buffer.from(buffer).toString('base64');
  console.log('Base64 String before compression:', base64String);

  // Compress the image using sharp
  const compressedBuffer = await sharp(Buffer.from(buffer))
    .resize({ width: 800 })
    .grayscale()
    .jpeg({ quality: 70 })
    .toBuffer();

  const compressedBase64String = compressedBuffer.toString('base64');
  console.log('Base64 String after compression:', compressedBase64String);

  return compressedBase64String;
};

const processUploadedFile = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString('base64');
};

module.exports = {
  processImageUrl,
  processUploadedFile,
};