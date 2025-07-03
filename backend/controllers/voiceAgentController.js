const OpenAI = require('openai');
const axios = require('axios');
const WebSocket = require('ws');
const { 
  playTrack, 
  pausePlayback, 
  resumePlayback, 
  skipToNext, 
  skipToPrevious, 
  seekToPosition, 
  setVolume, 
  addToQueue, 
  getCurrentlyPlaying,
  getUserDevices,
  transferPlayback
} = require('../utils/spotifyPlaybackUtils');
const { searchTrack, getAccessToken } = require('../utils/spotifyUtils');
const { intelligentMusicSearch, getTopTracksByTag, getSimilarArtistTracks, getArtistTopTracks } = require('../utils/musicDiscoveryUtils');
const { viaPrompt } = require('./openaiController2');
const { initializePlaylist, addTracksToPlaylist } = require('../utils/spotifyUtils');
const Playlist = require('../models/playlistModel');
const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI();

class VoiceAgentController {
  constructor() {
    this.activeConnections = new Map(); // Store active voice sessions
  }

  // Initialize a new voice agent session
  async initializeVoiceSession(req, res) {
    try {
      const { spotifyId } = req.session.user;
      const accessToken = await getAccessToken(spotifyId);
      
      // Create a unique session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Store session data
      this.activeConnections.set(sessionId, {
        spotifyId,
        accessToken,
        userId: spotifyId,
        isActive: true,
        conversationHistory: [], // Add conversation history
        hasActiveResponse: false // Track if there's an active response to cancel
      });
      // Immediately fetch current playback and add to context
      try {
        const sessionData = this.activeConnections.get(sessionId);
        const current = await getCurrentlyPlaying(accessToken);
        if (current && current.track) {
          const track = current.track;
          let artists = '';
          
          // Handle artists more carefully - same logic as injectCurrentContextToRealtime
          if (track.artists && Array.isArray(track.artists) && track.artists.length > 0) {
            artists = track.artists.map(a => a.name || 'Unknown Artist').join(', ');
          } else if (track.artists && typeof track.artists === 'string') {
            artists = track.artists;
          } else {
            artists = 'Unknown Artist';
          }
          
          sessionData.conversationHistory.push({
            role: 'system',
            content: `Currently playing: "${track.name}" by ${artists}`
          });
          console.log(`Initial context: Currently playing "${track.name}" by ${artists}`);
        }
      } catch (err) {
        console.warn('Could not fetch initial playback context:', err);
      }

      res.json({ 
        sessionId, 
        message: 'Voice agent session initialized',
        instructions: 'You can now start talking about music! I can help you discover new songs, control your Spotify playback, and have conversations about your musical preferences.'
      });
    } catch (error) {
      console.error('Error initializing voice session:', error);
      res.status(500).json({ error: 'Failed to initialize voice session' });
    }
  }

  // Handle WebSocket connection for real-time voice communication
  handleWebSocketConnection(ws, sessionId) {
    const sessionData = this.activeConnections.get(sessionId);
    
    if (!sessionData) {
      ws.close(1000, 'Invalid session');
      return;
    }

    console.log(`Voice agent connected for session: ${sessionId}`);    // Initialize OpenAI Realtime API session for voice communication
    const initializeOpenAISession = async () => {
      try {
        console.log('Initializing OpenAI Realtime session...');
        
        // Set up OpenAI WebSocket connection for real-time voice communication
        const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        });

        openaiWs.on('open', () => {
          console.log('Connected to OpenAI Realtime API');
          
          // Send session configuration for voice agent
          openaiWs.send(JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: this.getVoiceAgentInstructions(sessionData.spotifyId),
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
              },
              tools: this.getSpotifyTools(),
              tool_choice: "auto",
              temperature: 0.8
            }
          }));
          
          // Send ready message to client
          ws.send(JSON.stringify({
            type: 'agent_ready',
            message: 'Voice agent initialized! You can now speak naturally about music and I\'ll control your Spotify.'
          }));
        });

        openaiWs.on('message', async (data) => {
          const message = JSON.parse(data.toString());
          await this.handleOpenAIMessage(message, ws, sessionData);
        });

        openaiWs.on('error', (error) => {
          console.error('OpenAI WebSocket error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'OpenAI connection error'
          }));
        });

        openaiWs.on('close', () => {
          console.log('OpenAI WebSocket closed');
        });

        sessionData.openaiWs = openaiWs;

        // Handle client messages
        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());
            await this.handleClientMessage(message, openaiWs, sessionData, ws);
          } catch (error) {
            console.error('Error handling client message:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              error: 'Failed to process message' 
            }));
          }
        });

      } catch (error) {
        console.error('Error initializing OpenAI session:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Failed to initialize voice agent' 
        }));
      }
    };

    initializeOpenAISession();    ws.on('close', () => {
      console.log(`Voice agent disconnected for session: ${sessionId}`);
      if (sessionData.openaiWs) {
        sessionData.openaiWs.close();
      }
      this.activeConnections.delete(sessionId);
    });
  }  // Handle messages from the client
  async handleClientMessage(message, openaiWs, sessionData, clientWs) {
    try {
      switch (message.type) {
        case 'input_audio_buffer.append':
          // Forward audio data to OpenAI for real-time processing
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: message.audio
            }));
          }
          break;
        
        case 'input_audio_buffer.commit':
          // Commit audio buffer for processing
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: 'input_audio_buffer.commit'
            }));
          }
          break;
        
        case 'response.create':
          // Request AI response without automatic context injection
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: 'response.create',
              response: {
                modalities: ["text", "audio"],
                instructions: "Respond naturally about music and use tools when appropriate."
              }
            }));
          }
          break;
        
        case 'text_message':
          // Handle text-based conversation (fallback)
          await this.processTextMessage(message.content, sessionData, clientWs);
          break;
        
        case 'conversation.item.create':
          // Forward conversation items to OpenAI
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify(message));
          }
          break;
        
        case 'response.cancel':
          // Manual interruption from client
          console.log('Manual response cancellation requested');
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN && sessionData.hasActiveResponse) {
            try {
              openaiWs.send(JSON.stringify({
                type: 'response.cancel'
              }));
              console.log('Sent response.cancel to OpenAI');
            } catch (error) {
              console.log('Cancel request failed:', error.message);
            }
          } else {
            console.log('No active response to cancel');
          }
          break;
        
        default:
          console.log('Unknown message type from client:', message.type);
      }
    } catch (error) {
      console.error('Error handling client message:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process message'
      }));
    }
  }// Process text message with OpenAI
  async processTextMessage(content, sessionData, clientWs) {
    try {
      // Explicit 'search' command (e.g., 'search latest releases from artist')
      const explicitMatch = content.match(/^search (.+)/i);
      if (explicitMatch) {
        const query = explicitMatch[1];
        // Perform web search via OpenAI WebSearch API
        const wsResp = await axios.post('https://api.openai.com/v1/web-search', { query }, {
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        const snippets = wsResp.data.items.slice(0, 5).map(item => `- ${item.title}: ${item.snippet}`).join('\n');
        const resultMessage = `Search results for "${query}":\n${snippets}`;
        // Send results immediately to client
        clientWs.send(JSON.stringify({
          type: 'agent_message',
          content: resultMessage,
          timestamp: new Date().toISOString()
        }));
        return; // skip further processing
      }

      // If user asks for recommendations, perform a web search
      const recKeywords = ['recommend', 'suggest', 'top', 'best', 'hits'];
      const lc = content.toLowerCase();
      if (recKeywords.some(k => lc.includes(k))) {
        // Simple web search via OpenAI WebSearch API
        const wsResp = await axios.post('https://api.openai.com/v1/web-search', { query: content }, {
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        const snippets = wsResp.data.items.slice(0,3).map(item => item.snippet).join('\n');
        // Append web search results to conversation history
        sessionData.conversationHistory.push({ role: 'system', content: `Web search results:\n${snippets}` });
        console.log('Web search results:', snippets);
      }

      // Handle explicit "currently playing" query before AI
      if (/current(?:ly)? playing|what.*(song|track|music)|this (song|track)/i.test(content)) {
        // Fetch current track and build context
        const current = await getCurrentlyPlaying(sessionData.accessToken);
        let trackInfo;
        if (current && current.track) {
          const track = current.track;
          let artists = '';
          
          // Handle artists more carefully - same logic as injectCurrentContextToRealtime  
          if (track.artists && Array.isArray(track.artists) && track.artists.length > 0) {
            artists = track.artists.map(a => a.name || 'Unknown Artist').join(', ');
          } else if (track.artists && typeof track.artists === 'string') {
            artists = track.artists;
          } else {
            artists = 'Unknown Artist';
          }
          
          trackInfo = `Currently playing: "${track.name}" by ${artists}`;
        } else {
          trackInfo = 'No track is currently playing.';
        }
        // Inject user query and system context
        sessionData.conversationHistory.push({ role: 'user', content });
        sessionData.conversationHistory.push({ role: 'system', content: trackInfo });
        // Build messages for ChatCompletion
        const messages = [
          { role: 'system', content: this.getVoiceAgentInstructions(sessionData.spotifyId) },
          ...sessionData.conversationHistory
        ];
        // Ask the AI to respond
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          tools: this.getSpotifyTools(),
          tool_choice: 'auto',
          temperature: 0.7
        });
        const aiContent = response.choices[0].message.content;
        // Add assistant's response to history and send to client
        sessionData.conversationHistory.push({ role: 'assistant', content: aiContent });
        clientWs.send(JSON.stringify({ type: 'agent_message', content: aiContent, timestamp: new Date().toISOString() }));
        return;
      }
      // Send user message to client for display
      clientWs.send(JSON.stringify({
        type: 'user_message',
        content: content,
        timestamp: new Date().toISOString()
      }));

      // Add user message to conversation history
      sessionData.conversationHistory.push({
        role: "user",
        content: content
      });

      // Keep conversation history manageable (last 10 messages)
      if (sessionData.conversationHistory.length > 12) sessionData.conversationHistory.shift();

      // Build messages array with system prompt and conversation history
      const messages = [
        { role: "system", content: this.getVoiceAgentInstructions(sessionData.spotifyId) },
        ...sessionData.conversationHistory
      ];

      // Process with OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        tools: this.getSpotifyTools(),
        tool_choice: "auto",
        temperature: 0.7
      });

      const aiMessage = response.choices[0].message;
      let functionResults = [];

      // Handle function calls if any
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        // Add the assistant message with tool calls to conversation history
        sessionData.conversationHistory.push({
          role: "assistant",
          content: aiMessage.content,
          tool_calls: aiMessage.tool_calls
        });

        for (const toolCall of aiMessage.tool_calls) {
          const result = await this.executeSpotifyAction({
            name: toolCall.function.name,
            arguments: toolCall.function.arguments,
            call_id: toolCall.id
          }, sessionData, clientWs);
          
          functionResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result)
          });
        }

        // Add function results to conversation history
        sessionData.conversationHistory.push(...functionResults);

        // Make a follow-up request to get the AI's response after the function execution
        const followUpMessages = [
          {
            role: "system",
            content: this.getVoiceAgentInstructions(sessionData.spotifyId)
          },
          ...sessionData.conversationHistory
        ];

        const followUpResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: followUpMessages,
          temperature: 0.7
        });

        // Send the follow-up AI response
        if (followUpResponse.choices[0].message.content) {
          const followUpContent = followUpResponse.choices[0].message.content;
          
          // Add to conversation history
          sessionData.conversationHistory.push({
            role: "assistant",
            content: followUpContent
          });

          clientWs.send(JSON.stringify({
            type: 'agent_message',
            content: followUpContent,
            timestamp: new Date().toISOString()
          }));
        }
      } else {
        // No function calls, just send the AI response
        if (aiMessage.content) {
          // Add to conversation history
          sessionData.conversationHistory.push({
            role: "assistant",
            content: aiMessage.content
          });

          clientWs.send(JSON.stringify({
            type: 'agent_message',
            content: aiMessage.content,
            timestamp: new Date().toISOString()
          }));
        }
      }

    } catch (error) {
      console.error('Error processing text message:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process your message'
      }));
    }
  }
  // Placeholder for future audio processing
  // async processAudioMessage(audioData, sessionData, clientWs) {
  //   // TODO: Implement speech-to-text and text-to-speech
  //   clientWs.send(JSON.stringify({
  //     type: 'info',
  //     content: 'Audio processing will be implemented in a future update. Please use text for now.'
  //   }));
  // }

  // Handle messages from OpenAI Realtime API
  async handleOpenAIMessage(message, clientWs, sessionData) {
    try {
      switch (message.type) {
        case 'session.created':
          console.log('OpenAI session created:', message.session.id);
          break;
        
        case 'session.updated':
          console.log('OpenAI session updated');
          break;
        
        case 'conversation.created':
          console.log('Conversation created');
          break;
        
        case 'input_audio_buffer.committed':
          console.log('Audio buffer committed successfully');
          break;
        
        case 'input_audio_buffer.cleared':
          console.log('Audio buffer cleared');
          break;
        
        case 'input_audio_buffer.speech_started':
          // User started speaking - interrupt current response if one is active
          console.log('User started speaking - checking for active response to interrupt');
          
          if (sessionData.openaiWs && sessionData.openaiWs.readyState === WebSocket.OPEN && sessionData.hasActiveResponse) {
            try {
              sessionData.openaiWs.send(JSON.stringify({
                type: 'response.cancel'
              }));
              console.log('Sent response.cancel due to user speech');
            } catch (error) {
              console.log('Failed to cancel response on speech start:', error.message);
            }
          }
          
          clientWs.send(JSON.stringify({
            type: 'speech_started',
            message: 'Listening...'
          }));
          break;
        
        case 'input_audio_buffer.speech_stopped':
          // User stopped speaking
          clientWs.send(JSON.stringify({
            type: 'speech_stopped',
            message: 'Processing...'
          }));
          break;
        
        case 'conversation.item.created':
          console.log('Conversation item created');
          break;
        
        case 'conversation.item.input_audio_transcription.completed':
          // Send transcription to client
          console.log('Transcription completed:', message.transcript);
          
          // Store transcription in conversation history
          sessionData.conversationHistory.push({
            role: 'user',
            content: message.transcript
          });
          
          clientWs.send(JSON.stringify({
            type: 'transcription',
            content: message.transcript,
            timestamp: new Date().toISOString()
          }));
          
          // Only inject context if user is asking about current playback
          const transcriptLower = message.transcript.toLowerCase();
          const contextKeywords = [
            'what\'s playing', 'what is playing', 'currently playing', 'current song', 
            'what song', 'this song', 'the song', 'playing song', 'about the song',
            'tell me about', 'about this', 'about the track', 'what track'
          ];
          
          // Also check for patterns like "tell me about the [song/track/music] you're playing"
          const aboutPlayingPattern = /tell me about.*playing|about.*playing|about the.*you'?re playing/i;
          
          if (contextKeywords.some(keyword => transcriptLower.includes(keyword)) || aboutPlayingPattern.test(transcriptLower)) {
            console.log('User asking about current playback - injecting context');
            await this.injectCurrentContextToRealtime(sessionData, sessionData.openaiWs);
          }
          break;
        
        case 'conversation.item.input_audio_transcription.delta':
          // Handle streaming transcription delta (don't log these as they're frequent)
          break;
        
        case 'conversation.item.input_audio_transcription.failed':
          console.error('Transcription failed:', message.error);
          break;
        
        case 'response.created':
          console.log('Response created');
          // Track that we now have an active response
          sessionData.hasActiveResponse = true;
          // Don't inject context automatically - let the AI respond naturally
          break;
        
        case 'response.output_item.added':
          console.log('Output item added');
          break;
        
        case 'response.content_part.added':
          console.log('Content part added');
          break;
        
        case 'response.audio_transcript.delta':
          console.log('Audio transcript delta');
          break;
        
        case 'response.audio_transcript.done':
          console.log('Audio transcript done');
          break;
        
        case 'response.content_part.done':
          console.log('Content part done');
          break;
        
        case 'response.audio.delta':
          // Forward audio response to client
          clientWs.send(JSON.stringify({
            type: 'response.audio.delta',
            audio: message.delta
          }));
          break;
        
        case 'response.audio.done':
          // Audio response completed
          clientWs.send(JSON.stringify({
            type: 'response.audio.done'
          }));
          break;
        
        case 'response.text.delta':
          // Forward text response delta
          clientWs.send(JSON.stringify({
            type: 'response.text.delta',
            text: message.delta
          }));
          break;
        
        case 'response.text.done':
          // Text response completed
          clientWs.send(JSON.stringify({
            type: 'response.text.done',
            content: message.text
          }));
          break;
        
        case 'response.function_call_delta':
          // Function call in progress
          if (message.delta && message.delta.name) {
            console.log('Function call delta:', message.delta.name);
          }
          break;
        
        case 'response.output_item.done':
          // Handle completed function calls
          if (message.item.type === 'function_call') {
            await this.executeSpotifyAction({
              name: message.item.name,
              arguments: message.item.arguments,
              call_id: message.item.call_id
            }, sessionData, clientWs);
          }
          break;
        
        case 'response.done':
          // Complete response finished
          sessionData.hasActiveResponse = false;
          clientWs.send(JSON.stringify({
            type: 'response.done'
          }));
          break;
        
        case 'response.cancelled':
          // Response was cancelled (due to interruption)
          console.log('Response cancelled due to interruption');
          sessionData.hasActiveResponse = false;
          clientWs.send(JSON.stringify({
            type: 'response.cancelled'
          }));
          break;
        
        case 'rate_limits.updated':
          console.log('Rate limits updated:', message.rate_limits);
          break;
        
        case 'error':
          console.error('OpenAI Realtime API error:', message.error);
          
          // Handle specific error types gracefully
          if (message.error.code === 'response_cancel_not_active') {
            console.log('Tried to cancel response when none was active - this is normal');
            return; // Don't forward this error to client as it's expected
          }
          
          clientWs.send(JSON.stringify({
            type: 'error',
            error: message.error.message || 'OpenAI API error'
          }));
          // Don't close the WebSocket on errors, let it recover
          break;
        
        default:
          // Log unknown message types but don't forward them (reduces noise)
          console.log('Unknown OpenAI message type:', message.type, message);
          break;
      }
    } catch (error) {
      console.error('Error handling OpenAI message:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process AI response'
      }));
    }
  }
  // Execute Spotify actions based on function calls
  async executeSpotifyAction(functionCall, sessionData, clientWs) {
    try {
      const { name, arguments: args } = functionCall;
      let parsedArgs;
      
      try {
        parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
      } catch (e) {
        parsedArgs = args || {};
      }
      
      let result;
      
      switch (name) {
        case 'play_track':
          result = await this.handlePlayTrack(parsedArgs, sessionData);
          break;
        case 'pause_playback':
          result = await pausePlayback(sessionData.accessToken);
          break;
        case 'resume_playback':
          result = await resumePlayback(sessionData.accessToken);
          break;
        case 'skip_to_next':
          result = await skipToNext(sessionData.accessToken);
          break;
        case 'skip_to_previous':
          result = await skipToPrevious(sessionData.accessToken);
          break;
        case 'seek_to_position':
          result = await seekToPosition(sessionData.accessToken, parsedArgs.position_ms);
          break;
        case 'set_volume':
          result = await setVolume(sessionData.accessToken, parsedArgs.volume_percent);
          break;
        case 'add_to_queue':
          result = await this.handleAddToQueue(parsedArgs, sessionData);
          break;
      case 'get_currently_playing':
          // Retrieve and add current track info to conversation context
          result = await getCurrentlyPlaying(sessionData.accessToken);
          if (result && result.track) {
            const track = result.track;
            const artists = Array.isArray(track.artists) ? track.artists.map(a => a.name).join(', ') : '';
            // Append context for AI
            sessionData.conversationHistory.push({
              role: 'system',
              content: `Currently playing: "${track.name}" by ${artists}`
            });
          }
          break;
        case 'search_and_play':
          result = await this.handleSearchAndPlay(parsedArgs, sessionData);
          break;
        case 'discover_music':
          result = await this.handleMusicDiscovery(parsedArgs, sessionData);
          break;
        case 'get_recommendations':
          result = await this.handleGetRecommendations(parsedArgs, sessionData);
          break;
        case 'search_music_by_description':
          result = await this.handleSearchByDescription(parsedArgs, sessionData);
          break;
        case 'create_playlist':
          result = await this.handleCreatePlaylist(parsedArgs, sessionData);
          break;
        case 'play_playlist':
          result = await this.handlePlayPlaylist(parsedArgs, sessionData);
          break;
        default:
          result = { error: 'Unknown function' };
      }

      // Notify client of action completion
      clientWs.send(JSON.stringify({
        type: 'spotify_action_completed',
        action: name,
        result
      }));

      return result;

    } catch (error) {
      console.error('Error executing Spotify action:', error);
      
      const errorResult = { error: error.message };
      
      // Notify client of error
      clientWs.send(JSON.stringify({
        type: 'spotify_action_error',
        action: functionCall.name,
        error: error.message
      }));
      
      return errorResult;
    }
  }

  // Helper method to handle playing a specific track
  async handlePlayTrack(args, sessionData) {
    const { song, artist } = args;
    const trackId = await searchTrack({ song, artist }, sessionData.accessToken);
    
    if (trackId) {
      return await playTrack(sessionData.accessToken, trackId);
    } else {
      throw new Error(`Could not find track: ${song} by ${artist}`);
    }
  }

  // Helper method to handle adding to queue
  async handleAddToQueue(args, sessionData) {
    const { song, artist } = args;
    const trackId = await searchTrack({ song, artist }, sessionData.accessToken);
    
    if (trackId) {
      return await addToQueue(sessionData.accessToken, trackId);
    } else {
      throw new Error(`Could not find track: ${song} by ${artist}`);
    }
  }

  // Helper method to handle search and play
  async handleSearchAndPlay(args, sessionData) {
    const { query } = args;
    // Simple parsing to extract song and artist from query
    const parts = query.split(' by ');
    if (parts.length === 2) {
      return await this.handlePlayTrack({ song: parts[0], artist: parts[1] }, sessionData);
    } else {
      // If can't parse, search for the query as is
      const trackId = await searchTrack({ song: query, artist: '' }, sessionData.accessToken);
      if (trackId) {
        return await playTrack(sessionData.accessToken, trackId);
      } else {
        throw new Error(`Could not find track for query: ${query}`);
      }
    }
  }

  // Helper method to handle music discovery
  async handleMusicDiscovery(args, sessionData) {
    const { query, limit = 8 } = args;
    
    try {
      const discoveryResult = await intelligentMusicSearch(query, limit);
      
      if (discoveryResult.tracks && discoveryResult.tracks.length > 0) {
        // Format the results for the AI
        const trackList = discoveryResult.tracks.map((track, index) => 
          `${index + 1}. "${track.name}" by ${track.artist}`
        ).join('\n');
        
        return {
          success: true,
          message: `Found ${discoveryResult.count} tracks using ${discoveryResult.strategy}`,
          tracks: discoveryResult.tracks,
          strategy: discoveryResult.strategy,
          formatted_list: trackList
        };
      } else {
        return {
          success: false,
          message: `No tracks found for "${query}". Try a different search term or genre.`,
          tracks: []
        };
      }
    } catch (error) {
      throw new Error(`Music discovery failed: ${error.message}`);
    }
  }

  // Helper method to handle music recommendations
  async handleGetRecommendations(args, sessionData) {
    const { type, artist, genre, limit = 8 } = args;
    
    try {
      let result;
      
      if (type === 'similar_artist' && artist) {
        const tracks = await getSimilarArtistTracks(artist, limit);
        result = {
          tracks,
          strategy: `Artists similar to ${artist}`,
          message: `Found tracks from artists similar to ${artist}`
        };
      } else if (type === 'top_by_genre' && genre) {
        const tracks = await getTopTracksByTag(genre, limit);
        result = {
          tracks,
          strategy: `Top ${genre} tracks`,
          message: `Found top ${genre} tracks`
        };
      } else if (type === 'artist_top_tracks' && artist) {
        const tracks = await getArtistTopTracks(artist, limit);
        result = {
          tracks,
          strategy: `Top tracks by ${artist}`,
          message: `Found top tracks by ${artist}`
        };
      } else {
        throw new Error('Invalid recommendation parameters. Specify type and relevant parameters.');
      }
      
      if (result.tracks && result.tracks.length > 0) {
        const trackList = result.tracks.map((track, index) => 
          `${index + 1}. "${track.name}" by ${track.artist?.name || track.artist}`
        ).join('\n');
        
        return {
          success: true,
          message: result.message,
          tracks: result.tracks,
          strategy: result.strategy,
          formatted_list: trackList
        };
      } else {
        return {
          success: false,
          message: `No recommendations found for the given parameters.`,
          tracks: []
        };
      }
    } catch (error) {
      throw new Error(`Recommendations failed: ${error.message}`);
    }
  }

  // Helper method to handle search by description
  async handleSearchByDescription(args, sessionData) {
    const { description, limit = 8 } = args;
    
    try {
      const discoveryResult = await intelligentMusicSearch(description, limit);
      
      if (discoveryResult.tracks && discoveryResult.tracks.length > 0) {
        const trackList = discoveryResult.tracks.map((track, index) => 
          `${index + 1}. "${track.name}" by ${track.artist}`
        ).join('\n');
        
        return {
          success: true,
          message: `Found music matching "${description}" using ${discoveryResult.strategy}`,
          tracks: discoveryResult.tracks,
          strategy: discoveryResult.strategy,
          formatted_list: trackList,
          description
        };
      } else {
        return {
          success: false,
          message: `No music found matching "${description}". Try a different description.`,
          tracks: []
        };
      }
    } catch (error) {
      throw new Error(`Search by description failed: ${error.message}`);
    }
  }

  // Helper method to handle playlist creation
  async handleCreatePlaylist(args, sessionData) {
    const { prompt, numberOfSongs = 10, playlistName } = args;
    
    try {
      console.log(`Creating playlist with prompt: "${prompt}", songs: ${numberOfSongs}`);
      
      // Get user information
      const user = await User.findOne({ spotifyId: sessionData.spotifyId });
      if (!user || !user.accessToken) {
        throw new Error('User not found or access token missing');
      }

      // Check daily limit
      const canCreate = await user.checkDailyLimit();
      if (!canCreate && !user.isUnlimited) {
        throw new Error(`Daily playlist limit reached (${user.playlistCount}/${user.dailyPlaylistLimit}). Limit resets tomorrow.`);
      }

      // Generate playlist data using AI
      console.log('Generating playlist data with AI...');
      const playlistData = await viaPrompt(prompt, numberOfSongs);
      
      if (!playlistData || !playlistData.songs || playlistData.songs.length === 0) {
        throw new Error('Failed to generate playlist data');
      }

      // Search for tracks on Spotify
      console.log('Searching for tracks on Spotify...');
      const trackSearchPromises = playlistData.songs.map(song => 
        searchTrack(song, sessionData.accessToken)
      );
      const trackIds = await Promise.all(trackSearchPromises);
      
      // Filter out null results
      const validTrackIds = trackIds.filter(id => id !== null);
      
      if (validTrackIds.length === 0) {
        throw new Error('No tracks could be found on Spotify for this playlist');
      }

      // Create playlist on Spotify
      console.log('Creating playlist on Spotify...');
      const finalPlaylistName = playlistName || playlistData.name;
      const spotifyPlaylist = await initializePlaylist(
        sessionData.spotifyId,
        finalPlaylistName,
        playlistData.description,
        sessionData.accessToken
      );

      // Add tracks to Spotify playlist
      console.log('Adding tracks to Spotify playlist...');
      await addTracksToPlaylist(spotifyPlaylist.id, validTrackIds, sessionData.accessToken);

      // Save playlist to database
      console.log('Saving playlist to database...');
      const playlist = new Playlist({
        title: finalPlaylistName,
        description: playlistData.description,
        prompt,
        noOfSongs: validTrackIds.length,
        spotifyUrl: spotifyPlaylist.external_urls.spotify,
        spotifyId: spotifyPlaylist.id,
        userId: user._id
      });

      await playlist.save();

      // Add playlist reference to user and increment count
      user.playlists.push(playlist._id);
      if (!user.isUnlimited) {
        user.playlistCount += 1;
      }
      await user.save();

      console.log(`Playlist created successfully: ${finalPlaylistName}`);

      // Format songs as strings for frontend display
      const formattedSongs = playlistData.songs.slice(0, validTrackIds.length).map(song => {
        if (typeof song === 'string') {
          return song;
        } else if (song && song.song && song.artist) {
          return `${song.song} by ${song.artist}`;
        } else {
          return String(song);
        }
      });

      return {
        success: true,
        message: `Successfully created playlist "${finalPlaylistName}" with ${validTrackIds.length} songs!`,
        playlistName: finalPlaylistName,
        description: playlistData.description,
        numberOfSongs: validTrackIds.length,
        spotifyUrl: spotifyPlaylist.external_urls.spotify,
        spotifyId: spotifyPlaylist.id,
        playlistId: playlist._id.toString(),
        songs: formattedSongs,
        spotifyPlaylistUri: spotifyPlaylist.uri // Add Spotify URI for playing
      };

    } catch (error) {
      console.error('Error creating playlist:', error);
      throw new Error(`Failed to create playlist: ${error.message}`);
    }
  }

  // Helper method to play a playlist
  async handlePlayPlaylist(args, sessionData) {
    const { playlistUri, playlistId } = args;
    
    try {
      console.log(`Playing playlist: ${playlistUri || playlistId}`);
      
      // Use the playlistUri if available, otherwise construct from playlistId
      const uri = playlistUri || `spotify:playlist:${playlistId}`;
      
      // Start playback of the playlist
      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionData.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context_uri: uri
        })
      });

      if (response.status === 204) {
        return {
          success: true,
          message: 'Playlist playback started successfully!'
        };
      } else if (response.status === 404) {
        return {
          success: false,
          error: 'No active Spotify device found. Please open Spotify on a device and try again.'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('Error playing playlist:', error);
      throw new Error(`Failed to play playlist: ${error.message}`);
    }
  }

  // Get voice agent instructions
  getVoiceAgentInstructions(spotifyId) {
    return `You are MELODY, an intelligent music companion with deep knowledge of music across all genres, decades, and cultures. You can have natural conversations about music while controlling the user's Spotify playback, discovering new music, and creating custom playlists.

PERSONALITY:
- Enthusiastic and knowledgeable about music
- Conversational and friendly, like talking to a music-loving friend
- Proactive in making music recommendations based on context
- Able to discuss music history, artists, genres, and personal preferences
- Expert at finding music that matches moods, descriptions, and preferences
- Creative playlist curator who can generate themed playlists from user ideas

CAPABILITIES:
1. MUSIC CONVERSATION: Discuss artists, songs, albums, genres, music history, and personal preferences
2. SPOTIFY CONTROL: Play songs, pause/resume, skip tracks, adjust volume, add to queue, and more
3. MUSIC DISCOVERY: Find tracks by genre, mood, description, or similarity to artists
4. RECOMMENDATIONS: Suggest music based on conversation context, user preferences, and musical relationships
5. INTELLIGENT SEARCH: Find music using natural language descriptions like "upbeat 80s music" or "songs similar to Radiohead"
6. PLAYLIST CREATION: Generate custom playlists based on user prompts and preferences

BEHAVIOR GUIDELINES:
- When users ask for recommendations, ALWAYS use the music discovery tools first before suggesting specific tracks
- If discussing a genre or mood, use discovery tools to find relevant tracks rather than guessing
- When users mention wanting music "like" an artist, use the similarity search capabilities
- Be proactive in offering to find and play music that matches the conversation
- If users describe what they want (e.g., "something energetic", "relaxing jazz", "90s hits"), use the search by description tool
- After finding recommendations, offer to play specific tracks from the results
- Remember context from the conversation to make better recommendations
- When users want to create playlists, use the playlist creation tool to generate custom playlists
- Offer to create playlists when discussing specific themes, moods, or occasions

MUSIC DISCOVERY TOOLS:
Use these tools when users ask for recommendations or describe music they want:
- discover_music: For general music discovery using natural language (e.g., "modern jazz hits", "upbeat pop songs")
- get_recommendations: For specific types of recommendations (artist's best songs when asked for a song by the same artist or similar artists if asked for a similar recommendation, top tracks by genre, artist's best songs)
- search_music_by_description: For finding music based on descriptive terms (moods, eras, styles)

PLAYLIST CREATION & PLAYBACK:
Use the create_playlist tool when users want to:
- Create a custom playlist based on a theme, mood, or description
- Generate music for specific activities (workout, study, party, relaxation)
- Make playlists for events or occasions (road trip, date night, summer vibes)
- Curate music around specific genres, eras, or artists
- Build playlists from conversational context (e.g., if discussing sad music, offer to create a melancholy playlist)

After creating a playlist, you can offer to play it immediately using the play_playlist tool.

SPOTIFY ACTIONS:
You can perform these actions by calling the appropriate functions:
- Play specific tracks
- Pause/resume playback  
- Skip to next/previous tracks
- Adjust volume
- Add songs to queue
- Get currently playing information
- Search and play music
- Discover new music based on preferences
- Get recommendations by artist, genre, or similarity
- Create custom playlists on Spotify
- Play playlists immediately after creation

CONVERSATION STYLE:
- Natural, flowing conversation about music
- Ask follow-up questions about musical preferences
- Share interesting facts about artists or songs
- Suggest music that fits the current conversation or mood
- Use discovery tools to provide personalized recommendations
- Be helpful with Spotify controls while maintaining the conversational flow
- Proactively suggest playlist creation when appropriate

PLAYLIST CREATION EXAMPLES:
- "Create a workout playlist with high-energy songs"
- "Make me a chill study playlist"
- "Generate a road trip playlist with classic rock"
- "I need a romantic dinner playlist"
- "Create a 90s nostalgia playlist"
- "Make a playlist for a house party"

IMPORTANT: 
- When users ask for music recommendations or describe what they want to hear, ALWAYS use the music discovery tools first
- Don't try to guess song names - use the tools to find actual tracks that match their request
- When creating playlists, ask for clarification on number of songs if not specified (default to 10-15 songs)
- After creating a playlist, offer to play it immediately using the play_playlist tool
- Be creative with playlist names and descriptions based on the user's prompt
- Proactively suggest playing newly created playlists: "I've created your playlist! Would you like me to start playing it now?", you have the ability to play playlists using the spotify control tools.

Remember: You're not just a voice command interface - you're a music companion who loves talking about music, helping users discover new tracks, creating perfect playlists, and playing them for any occasion.`;
  }  // Define Spotify control tools for OpenAI
  getSpotifyTools() {
    return [
      {
        type: "function",
        name: "play_track",
        description: "Play a specific song on Spotify",
        parameters: {
          type: "object",
          properties: {
            song: { type: "string", description: "The name of the song to play" },
            artist: { type: "string", description: "The artist name" }
          },
          required: ["song", "artist"]
        }
      },
      {
        type: "function",
        name: "pause_playback",
        description: "Pause the current Spotify playback",
        parameters: { type: "object", properties: {} }
      },
      {
        type: "function",
        name: "resume_playback",
        description: "Resume paused Spotify playback",
        parameters: { type: "object", properties: {} }
      },
      {
        type: "function",
        name: "skip_to_next",
        description: "Skip to the next track",
        parameters: { type: "object", properties: {} }
      },
      {
        type: "function",
        name: "skip_to_previous",
        description: "Skip to the previous track",
        parameters: { type: "object", properties: {} }
      },
      {
        type: "function",
        name: "seek_to_position",
        description: "Seek to a specific position in the current track",
        parameters: {
          type: "object",
          properties: {
            position_ms: { type: "integer", description: "Position in milliseconds" }
          },
          required: ["position_ms"]
        }
      },
      {
        type: "function",
        name: "set_volume",
        description: "Set the playback volume",
        parameters: {
          type: "object",
          properties: {
            volume_percent: { type: "integer", minimum: 0, maximum: 100, description: "Volume percentage (0-100)" }
          },
          required: ["volume_percent"]
        }
      },
      {
        type: "function",
        name: "add_to_queue",
        description: "Add a song to the playback queue",
        parameters: {
          type: "object",
          properties: {
            song: { type: "string", description: "The name of the song to add to queue" },
            artist: { type: "string", description: "The artist name" }
          },
          required: ["song", "artist"]
        }
      },
      {
        type: "function",
        name: "get_currently_playing",
        description: "Get information about the currently playing track",
        parameters: { type: "object", properties: {} }
      },
      {
        type: "function",
        name: "search_and_play",
        description: "Search for and play music based on a natural language query",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Natural language search query for music" }
          },
          required: ["query"]
        }
      },
      {
        type: "function",
        name: "discover_music",
        description: "Discover music using intelligent search with natural language queries. Use this for recommendations like 'modern jazz hits', 'upbeat 80s music', 'songs similar to Radiohead', etc.",
        parameters: {
          type: "object",
          properties: {
            query: { 
              type: "string", 
              description: "Natural language query describing the type of music to find (e.g., 'modern jazz hits', 'relaxing acoustic songs', 'energetic rock music', 'songs like Coldplay')" 
            },
            limit: { 
              type: "integer", 
              description: "Number of tracks to find (1-20)", 
              minimum: 1, 
              maximum: 20, 
              default: 8 
            }
          },
          required: ["query"]
        }
      },
      {
        type: "function",
        name: "get_recommendations",
        description: "Get specific types of music recommendations based on artists, genres, or similarity",
        parameters: {
          type: "object",
          properties: {
            type: { 
              type: "string", 
              enum: ["similar_artist", "top_by_genre", "artist_top_tracks"],
              description: "Type of recommendation: 'similar_artist' for artists similar to a given artist, 'top_by_genre' for top tracks in a genre, 'artist_top_tracks' for an artist's best songs"
            },
            artist: { 
              type: "string", 
              description: "Artist name (required for 'similar_artist' and 'artist_top_tracks' types)" 
            },
            genre: { 
              type: "string", 
              description: "Genre name (required for 'top_by_genre' type, e.g., 'jazz', 'rock', 'electronic')" 
            },
            limit: { 
              type: "integer", 
              description: "Number of tracks to find (1-20)", 
              minimum: 1, 
              maximum: 20, 
              default: 8 
            }
          },
          required: ["type"]
        }
      },
      {
        type: "function",
        name: "search_music_by_description",
        description: "Find music based on descriptive terms, moods, or characteristics",
        parameters: {
          type: "object",
          properties: {
            description: { 
              type: "string", 
              description: "Description of the music to find (e.g., 'energetic workout music', 'sad piano songs', 'chill electronic beats', 'romantic ballads')" 
            },
            limit: { 
              type: "integer", 
              description: "Number of tracks to find (1-20)", 
              minimum: 1, 
              maximum: 20, 
              default: 8 
            }
          },
          required: ["description"]
        }
      },
      {
        type: "function",
        name: "create_playlist",
        description: "Create a custom playlist on Spotify based on a user's prompt or theme. Use this when users want to create playlists for specific moods, activities, genres, or occasions.",
        parameters: {
          type: "object",
          properties: {
            prompt: { 
              type: "string", 
              description: "The theme, mood, or description for the playlist (e.g., 'upbeat workout songs', 'chill study music', 'road trip classics', 'romantic dinner music')" 
            },
            numberOfSongs: { 
              type: "integer", 
              description: "Number of songs to include in the playlist (5-50)", 
              minimum: 5, 
              maximum: 50, 
              default: 12 
            },
            playlistName: { 
              type: "string", 
              description: "Optional custom name for the playlist. If not provided, AI will generate an appropriate name based on the prompt." 
            }
          },
          required: ["prompt"]
        }
      },
      {
        type: "function",
        name: "play_playlist",
        description: "Play a Spotify playlist that was previously created or any playlist by ID",
        parameters: {
          type: "object",
          properties: {
            playlistUri: { 
              type: "string", 
              description: "The Spotify URI of the playlist to play (e.g., 'spotify:playlist:12345')" 
            },
            playlistId: { 
              type: "string", 
              description: "The Spotify playlist ID (alternative to playlistUri)" 
            }
          }
        }
      }
    ];
  }

  // Terminate a voice session
  terminateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const sessionData = this.activeConnections.get(sessionId);
      
      if (sessionData) {
        if (sessionData.openaiWs) {
          sessionData.openaiWs.close();
        }
        this.activeConnections.delete(sessionId);
        res.json({ message: 'Session terminated successfully' });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } catch (error) {
      console.error('Error terminating session:', error);
      res.status(500).json({ error: 'Failed to terminate session' });
    }
  }

  // Get active sessions (for debugging)
  getActiveSessions(req, res) {
    try {
      const sessions = Array.from(this.activeConnections.keys());
      res.json({ activeSessions: sessions, count: sessions.length });
    } catch (error) {
      console.error('Error getting active sessions:', error);
      res.status(500).json({ error: 'Failed to get active sessions' });
    }
  }

  // Helper method to inject current context into Realtime session
  async injectCurrentContextToRealtime(sessionData, openaiWs) {
    try {
      // Get current track info
      const current = await getCurrentlyPlaying(sessionData.accessToken);
      let contextMessage = '';
      
      if (current && current.track) {
        const track = current.track;
        let artists = '';
        
        // Handle artists more carefully
        if (track.artists && Array.isArray(track.artists) && track.artists.length > 0) {
          artists = track.artists.map(a => a.name || 'Unknown Artist').join(', ');
        } else if (track.artists && typeof track.artists === 'string') {
          artists = track.artists;
        } else {
          console.warn('Artists field is missing or invalid:', track.artists);
          artists = 'Unknown Artist';
        }
        
        const album = track.album ? track.album.name : '';
        const duration = track.duration_ms ? Math.floor(track.duration_ms / 1000) : '';
        const progress = current.progress_ms ? Math.floor(current.progress_ms / 1000) : '';
        
        contextMessage = `CURRENT SPOTIFY STATUS: Track "${track.name}" by ${artists}`;
        if (album) contextMessage += ` from album "${album}"`;
        if (duration && progress) {
          contextMessage += ` (${progress}s/${duration}s played)`;
        }
        contextMessage += `. Use this information when discussing music or responding to user queries.`;
        
        console.log('Injecting context:', contextMessage);
      } else {
        contextMessage = 'CURRENT SPOTIFY STATUS: No track currently playing.';
        console.log('No track currently playing');
      }
      
      // Inject as a system message to the Realtime session
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'system',
            content: [{
              type: 'input_text',
              text: contextMessage
            }]
          }
        }));
      }
    } catch (error) {
      console.error('Error injecting context to Realtime:', error);
    }
  }
}

module.exports = new VoiceAgentController();
