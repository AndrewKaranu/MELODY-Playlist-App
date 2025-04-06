const OpenAI = require('openai');
const openai = new OpenAI();
const { processImageUrl, processUploadedFile } = require('../utils/openaiUtils.js');

const generateSystemPrompt = (context, noOfSongs) => {
    return {
      role: "system",
      content: `You are a playlist generator. ${context} You must respond with a valid JSON object in exactly this format:
  {
    "name": "A creative name with 2-5 words",
    "description": "A single sentence description",
    "songs": [
      {
        "song": "Song Name Here",
        "artist": "Artist Name Here"
      }
    ]
  }
  Do not include any additional text or formatting. Generate exactly ${noOfSongs} songs.`
    };
  };

async function viaPrompt(prompt, noOfSongs) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          generateSystemPrompt("Generate based on the user's prompt.", noOfSongs),
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
  
      const responseContent = response.choices?.[0]?.message?.content;
      if (!responseContent) throw new Error("Empty response");
      
      const parsedResponse = JSON.parse(responseContent);
      validatePlaylistResponse(parsedResponse);
      return parsedResponse;
    } catch (error) {
      console.error("Error generating playlist:", error);
      throw new Error(`Failed to generate playlist: ${error.message}`);
    }
  }
  
  async function viaListeningHistory(userId, timeRange, prompt, noOfSongs, listeningHistory) {
    try {
      const historyText = JSON.stringify(listeningHistory);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          generateSystemPrompt(`Using this listening history as context (but do not include these exact songs): ${historyText}`, noOfSongs),
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
  
      const responseContent = response.choices?.[0]?.message?.content;
      if (!responseContent) throw new Error("Empty response");
      
      const parsedResponse = JSON.parse(responseContent);
      validatePlaylistResponse(parsedResponse);
      return parsedResponse;
    } catch (error) {
      console.error("Error generating playlist:", error);
      throw new Error(`Failed to generate playlist: ${error.message}`);
    }
  }
  
  async function viaProvidedTracks(noOfSongs, providedTracks) {
    try {
      const tracksText = JSON.stringify(providedTracks);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          // Fixed: Removed parameter assignment in function call
          generateSystemPrompt(`Using these tracks as CONTEXT (do not include the tracks mentioned): ${tracksText}`, 50)
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
  
      // Rest of the function remains the same
      const responseContent = response.choices?.[0]?.message?.content;
      if (!responseContent) throw new Error("Empty response");
      
      const parsedResponse = JSON.parse(responseContent);
      validatePlaylistResponse(parsedResponse);
      return parsedResponse;
    } catch (error) {
      console.error("Error generating playlist:", error);
      throw new Error(`Failed to generate playlist: ${error.message}`);
    }
}

async function viaProvidedArtists(noOfSongs, providedArtists) {
    try {
      const artistsText = JSON.stringify(providedArtists);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          // Fixed: Removed parameter assignment in function call
          generateSystemPrompt(`Using these artists as context: ${artistsText}`, 50)
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
  
      // Rest of the function remains the same
      const responseContent = response.choices?.[0]?.message?.content;
      if (!responseContent) throw new Error("Empty response");
      
      const parsedResponse = JSON.parse(responseContent);
      validatePlaylistResponse(parsedResponse);
      return parsedResponse;
    } catch (error) {
      console.error("Error generating playlist:", error);
      throw new Error(`Failed to generate playlist: ${error.message}`);
    }
}

// Updated validation function with more detailed checks
const validatePlaylistResponse = (jsonResponse) => {
    console.log('HERE:\nValidating response:\n\n\n', jsonResponse);
    
    if (!jsonResponse || typeof jsonResponse !== 'object') {
      throw new Error('Response must be a valid object');
    }
  
    if (!jsonResponse.name || 
        typeof jsonResponse.name !== 'string' || 
        jsonResponse.name.trim() === '') {
      console.error('Invalid playlistName:', jsonResponse.name);
      throw new Error('Missing or invalid playlist name');
    }
  
    if (!jsonResponse.description || 
        typeof jsonResponse.description !== 'string' || 
        jsonResponse.description.trim() === '') {
      throw new Error('Missing or invalid description');
    }
  
    if (!Array.isArray(jsonResponse.songs) || jsonResponse.songs.length === 0) {
      throw new Error('Invalid songs array');
    }
  
    jsonResponse.songs.forEach((song, index) => {
      if (!song || typeof song !== 'object') {
        throw new Error(`Invalid song object at index ${index}`);
      }
      if (!song.song || typeof song.song !== 'string' || song.song.trim() === '') {
        throw new Error(`Invalid song name at index ${index}`);
      }
      if (!song.artist || typeof song.artist !== 'string' || song.artist.trim() === '') {
        throw new Error(`Invalid artist name at index ${index}`);
      }
    });
  
    return true;
  };

  const imageToPrompt = async (imageUrl, inputType) => {
    try {
      let imageBase64;
      if (inputType === 'url') {
        imageBase64 = await processImageUrl(imageUrl);
      } else if (inputType === 'file') {
        imageBase64 = processUploadedFile(imageUrl);
      }
  
      console.log('Image Base64:', imageBase64);
  
      const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-05-13",
        messages: [
          {
            role: "system",
            content: "You are a specialized image analyzer. Given an image, return a short prompt that describes the mood, theme, and any notable elements that could inspire a music playlist. Focus on emotions, atmosphere, and any specific objects or scenes that stand out.",
            role: "user",
            content: `data:image/jpeg;base64,${imageBase64}`,
            detail: "low"
          }
        ],
        temperature: 0.7,
        max_tokens: 500 
      });
  
      const responseContent = response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
  
      console.log('Response Content:', responseContent);
      if (!responseContent) {
        throw new Error("Invalid response from OpenAI API");
      }
  
      return responseContent;
    } catch (error) {
      console.error("Error processing image:", error);
      throw new Error("Failed to process image");
    }
  };
  
  
  
  const generateImage = async (prompt) => {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });
  
      return response.data[0].url;
    } catch (error) {
      console.error("Error generating image:", error);
      throw new Error("Failed to generate image");
    }
  };
  
  module.exports = { viaPrompt, viaListeningHistory, viaProvidedTracks, viaProvidedArtists, imageToPrompt, generateImage };
  