const OpenAI = require('openai');
const openai = new OpenAI();
const { processImageUrl, processUploadedFile } = require('../utils/openaiUtils.js');


//  Asterix from responses are indication of bold
//Function to prompt and generate playlist data using OpenAI's api
async function viaPrompt(prompt, noOfSongs, res) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a playlist generator. Given a user's prompt, generate a creative playlist name, a short one sentence description, and a list of ${noOfSongs} songs with song name and artist in the following format strictly:
          Playlist Name: <name>
          Description: <description>
          1. "Song Name" by Artist`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      // max_tokens: 200 //- remember to cap max tokens in production
    });

    const responseContent = response.choices?.[0]?.message?.content;
    console.log('Response Content:', responseContent);
    if (!responseContent) {
      throw new Error("Invalid response from OpenAI API");
    }

    const lines = responseContent.split('\n');
    const playlistName = lines.find(line => line.trim().startsWith('Playlist Name:'))?.replace('Playlist Name:', '').trim();
    const description = lines.find(line => line.trim().startsWith('Description:'))?.replace('Description:', '').trim();
    const songLines = lines.filter(line => /^\d+\./.test(line.trim()));
    console.log('Song Lines:', songLines);
    console.log('Lines:', lines);
    console.log('Playlist Name:', playlistName);
    console.log('Description:', description);
  
    const songs = lines
    .filter(line => /^\s*\d+\./.test(line))
    .map(line => {
      const match = line.match(/^\s*\d+\.\s*"(.+)"\s+by\s+(.+)$/);
      return match ? { song: match[1].trim(), artist: match[2].trim() } : null;
  })
  .filter(song => song !== null);

    const playlist = {
      name: playlistName,
      description: description,
      songs: songs
    };

    console.log("Generated Playlist:", playlist);
    return playlist; // Playlist Object
  } catch (error) {
    console.error("Error generating playlist:", error);
    throw new Error("Failed to generate playlist data");
  }
};

const viaListeningHistory = async (userId, timeRange, prompt, noOfSongs, listeningHistory,res) => {
  try {


    const historyText = listeningHistory.map((track, index) => `${index + 1}. "${track.song}" by ${track.artist}`).join('\n');
    console.log('This is the listening history:', historyText);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",//or gpt-4o-2024-05-13
      messages: [
        {
          role: "system",
          content: `You are a playlist generator. Given a user's prompt and listening history (strictly only use the history as context do not include songs from the users listening history) (User Listening History: ${historyText}), generate a creative playlist name, a short one sentence description, and a list of ${noOfSongs} songs with song name and artist in the following format strictly(dont use ** to indicate any fields):
          Playlist Name: <name>
          Description: <description>
          1. "Song Name" by Artist`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const responseContent = response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
    console.log('Response Content:', responseContent);
    if (!responseContent) {
      throw new Error("Invalid response from OpenAI API");
    }

    const lines = responseContent.split('\n');
    const playlistName = lines.find(line => line.trim().startsWith('Playlist Name:'))?.replace('Playlist Name:', '').trim();
    const description = lines.find(line => line.trim().startsWith('Description:'))?.replace('Description:', '').trim();
    const songLines = lines.filter(line => /^\d+\./.test(line.trim()));
    console.log('Song Lines:', songLines);
    console.log('Lines:', lines);
    console.log('Playlist Name:', playlistName);
    console.log('Description:', description);
  
    const songs = lines
    .filter(line => /^\s*\d+\./.test(line))
    .map(line => {
      const match = line.match(/^\s*\d+\.\s*"(.+)"\s+by\s+(.+)$/);
      return match ? { song: match[1].trim(), artist: match[2].trim() } : null;
  })
  .filter(song => song !== null);

    const playlist = {
      name: playlistName,
      description: description,
      songs: songs
    };

    console.log("Generated Playlist:", playlist);
    return playlist;
  } catch (error) {
    console.error("Error generating playlist:", error);
    throw new Error("Failed to generate playlist data");
  }
};


const viaProvidedTracks = async (noOfSongs, providedTracks) => {
  try {
    const providedTracksText = providedTracks.map((track, index) => `${index + 1}. "${track.name}" by ${track.artists}`).join('\n');
    console.log('This are the tracks I will be using:', providedTracksText);


    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a playlist generator. Given a list of provided tracks (use the tracks as context and generate a playlist with similar songs) (Provided Tracks: ${providedTracksText}), generate a creative playlist name, a short one sentence description, and a list of ${noOfSongs} songs with song name and artist in the following format strictly:
          Playlist Name: <name>
          Description: <description>
          1. "Song Name" by Artist`
        }
      ],
      temperature: 0.7,
    });
    const responseContent = response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Invalid response from OpenAI API");
    }

    const lines = responseContent.split('\n');
    const playlistNameLine = lines[0].replace('Playlist Name: ', '').trim();
    const descriptionLine = lines[1].replace('Description: ', '').trim();

    const songs = lines.slice(2).map(line => {
      const match = line.match(/^\d+\.\s+"(.+?)"\s+by\s+(.+)$/);
      return match ? { song: match[1], artist: match[2] } : null;
    }).filter(song => song !== null);

    const playlist = {
      name: playlistNameLine,
      description: descriptionLine,
      songs: songs
    };

    return playlist;
  } catch (error) {
    console.error("Error generating playlist:", error);
    throw new Error("Failed to generate playlist data");
  }
};

const viaProvidedArtists = async (noOfSongs, providedArtists) => {
  try {
    const providedArtistsText = providedArtists.map((artist, index) => {
      // Ensure artist.genres is an array before calling join
      return `${index + 1}. "${artist.name}"`;
    }).join('\n');
    console.log('These are the artists I will be using:', providedArtistsText);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a playlist generator. Given a list of provided artists (use the artists as context and generate a playlist with similar songs by similar artists) (Provided Artists: ${providedArtistsText}), generate a creative playlist name, a short one sentence description, and a list of ${noOfSongs} songs with song name and artist in the following format strictly:
          Playlist Name: <name>
          Description: <description>
          1. "Song Name" by Artist`
        }
      ],
      temperature: 0.7,
    });
    const responseContent = response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Invalid response from OpenAI API");
    }

    const lines = responseContent.split('\n');
    const playlistNameLine = lines[0].replace('Playlist Name: ', '').trim();
    const descriptionLine = lines[1].replace('Description: ', '').trim();

    const songs = lines.slice(2).map(line => {
      const match = line.match(/^\d+\.\s+"(.+?)"\s+by\s+(.+)$/);
      return match ? { song: match[1], artist: match[2] } : null;
    }).filter(song => song !== null);

    const playlist = {
      name: playlistNameLine,
      description: descriptionLine,
      songs: songs
    };

    return playlist;
  } catch (error) {
    console.error("Error generating playlist:", error);
    throw new Error("Failed to generate playlist data");
  }
};



const imageToPrompt = async (imageUrl, inputType) => {
  try {
    let imageBase64;
    if (inputType === 'url') {
      imageBase64 = await processImageUrl(imageUrl);
    } else if (inputType === 'file') {
      imageBase64 = processUploadedFile(imageUrl);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-05-13",
      messages: [
        {
          role: "system",
          content: "You are a specialized image analyzer. Given an image, return a short prompt that describes the whole image in one or two sentence."
        },
        {
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

