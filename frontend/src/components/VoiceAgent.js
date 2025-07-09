import React, { useState, useRef, useEffect } from 'react';
import VoiceAvatar from './VoiceAvatar';
import './styles/VoiceAgent.css';

const VoiceAgent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  
  // Avatar-related state
  const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'avatar'
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  
  // Instructions modal state
  const [showInstructions, setShowInstructions] = useState(true);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  // Ref for scrolling messages container without affecting whole page
  const messagesContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioBufferRef = useRef([]);
  const audioWorkletNodeRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioQueueTimeRef = useRef(0);
  const audioLevelRef = useRef(0);
  
  // Ref to track active audio sources for interruption
  const audioSourcesRef = useRef([]);
  // Function to stop all playing audio (for interruption)
  const stopAllAudio = () => {
    audioSourcesRef.current.forEach(src => {
      try { src.stop(); } catch (e) {}
    });
    audioSourcesRef.current = [];
    audioQueueTimeRef.current = 0;
    setIsPlaying(false);
    setIsProcessing(false);
    setAvatarSpeaking(false);
  };

  // Connect to WebSocket for real-time communication
  const connectWebSocket = (sessionId) => {
    const wsUrl = `ws://localhost:4000?sessionId=${sessionId}`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };
    
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    };
    
    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
  };

  // Initialize voice agent session
  const initializeSession = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/voice-agent/initialize', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize voice agent session');
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      
      // Add welcome message
      setMessages(prev => [...prev, {
        type: 'agent',
        content: data.instructions,
        timestamp: new Date()
      }]);
      
      // Connect WebSocket
      connectWebSocket(data.sessionId);
      
    } catch (err) {
      setError(err.message);
      console.error('Error initializing session:', err);
    } finally {
      setIsInitializing(false);
    }
  };
  // Handle WebSocket messages
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'agent_ready':
        setMessages(prev => [...prev, {
          type: 'agent',
          content: message.message,
          timestamp: new Date()
        }]);
        break;
        
      case 'user_message':
        // Interrupt any ongoing audio when a user message arrives
        stopAllAudio();
        setMessages(prev => [...prev, {
          type: 'user',
          content: message.content,
          timestamp: new Date(message.timestamp)
        }]);
        break;
        case 'agent_message':
        setMessages(prev => [...prev, {
          type: 'agent',
          content: message.content,
          timestamp: new Date(message.timestamp)
        }]);
        setIsTyping(false);
        break;
      
      // Voice interupt feature
      case 'speech_started':
        setIsProcessing(true);
        setCurrentEmotion('listening');
        // Interrupt any ongoing audio when user starts speaking
        stopAllAudio();
        setMessages(prev => [...prev, {
          type: 'system',
          content: '🎤 Listening...',
          timestamp: new Date()
        }]);
        break;
      
      case 'speech_stopped':
        setIsProcessing(true);
        setCurrentEmotion('thinking');
        setMessages(prev => [...prev, {
          type: 'system',
          content: '🤔 Processing...',
          timestamp: new Date()
        }]);
        break;
        case 'transcription':
        setMessages(prev => [...prev, {
          type: 'user',
          content: `🗣️ "${message.content}"`,
          timestamp: new Date(message.timestamp)
        }]);
        break;
      
      case 'response.audio.delta':
        // Schedule audio delta playback sequentially
        if (message.audio) {
          const duration = playAudioDelta(message.audio, audioQueueTimeRef.current);
          audioQueueTimeRef.current += duration;
          setIsPlaying(true);
          setAvatarSpeaking(true);
          setCurrentEmotion('happy');
        }
        break;
      
      case 'response.audio.done':
        // Reset audio queue timing and mark playback complete
        audioQueueTimeRef.current = 0;
        setIsPlaying(false);
        setIsProcessing(false);
        setAvatarSpeaking(false);
        setCurrentEmotion('neutral');
        setAudioLevel(0);
        // Update currently playing track after AI response completes
        setTimeout(() => updateCurrentlyPlaying(), 1000);
        break;
      
      case 'response.text.delta':
        // Handle streaming text response
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'agent' && lastMessage.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + message.text }
            ];
          } else {
            return [
              ...prev,
              { type: 'agent', content: message.text, isStreaming: true, timestamp: new Date() }
            ];
          }
        });
        break;
      
      case 'response.text.done':
        // Mark streaming as complete
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, isStreaming: false }
            ];
          }
          return prev;
        });
        break;
        case 'response.done':
        setIsProcessing(false);
        setIsPlaying(false);
        // Update currently playing track after any response completes
        setTimeout(() => updateCurrentlyPlaying(), 1000);
        break;
        
      case 'response.cancelled':
        // Response was cancelled due to interruption
        console.log('Response cancelled due to interruption');
        stopAllAudio();
        setIsProcessing(false);
        setIsPlaying(false);
        break;

      // OpenAI Realtime API message types
      case 'session.created':
        console.log('Session created:', message);
        break;
      
      case 'session.updated':
        console.log('Session updated:', message);
        break;
      
      case 'conversation.created':
        console.log('Conversation created:', message);
        break;
      
      case 'input_audio_buffer.committed':
        console.log('Audio buffer committed:', message);
        break;
      
      case 'input_audio_buffer.cleared':
        console.log('Audio buffer cleared:', message);
        break;
      
      case 'input_audio_buffer.speech_started':
        setIsProcessing(true);
        console.log('Speech started detected');
        break;
      
      case 'input_audio_buffer.speech_stopped':
        console.log('Speech stopped detected');
        break;
      
      case 'conversation.item.created':
        console.log('Conversation item created:', message);
        break;
      
      case 'conversation.item.input_audio_transcription.completed':
        console.log('Transcription completed:', message);
        if (message.transcript) {
          setMessages(prev => [...prev, {
            type: 'user',
            content: `🗣️ "${message.transcript}"`,
            timestamp: new Date()
          }]);
          // Forward transcript as text_message for search/handling
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'text_message',
              content: message.transcript
            }));
          }
        }
        break;
      
      case 'conversation.item.input_audio_transcription.failed':
        console.error('Transcription failed:', message);
        break;
      
      case 'response.created':
        console.log('Response created:', message);
        setIsProcessing(true);
        break;
      
      case 'response.output_item.added':
        console.log('Output item added:', message);
        break;
      
      case 'response.content_part.added':
        console.log('Content part added:', message);
        break;
      
      case 'response.audio_transcript.delta':
        // Handle streaming transcription of AI response
        console.log('Audio transcript delta:', message);
        break;
      
      case 'response.audio_transcript.done':
        console.log('Audio transcript done:', message);
        break;
      
      case 'response.content_part.done':
        console.log('Content part done:', message);
        break;
      
      case 'response.output_item.done':
        console.log('Output item done:', message);
        break;
      
      case 'rate_limits.updated':
        console.log('Rate limits updated:', message);
        break;
        
      case 'spotify_action_completed':
        // Handle successful Spotify actions
        if (message.action === 'create_playlist' && message.result.success) {
          setMessages(prev => [...prev, {
            type: 'playlist_created',
            content: message.result.message,
            playlistData: {
              name: message.result.playlistName,
              description: message.result.description,
              numberOfSongs: message.result.numberOfSongs,
              spotifyUrl: message.result.spotifyUrl,
              songs: message.result.songs,
              spotifyPlaylistUri: message.result.spotifyPlaylistUri
            },
            timestamp: new Date()
          }]);
        } else {
          setMessages(prev => [...prev, {
            type: 'system',
            content: `✓ ${message.action.replace(/_/g, ' ')}: ${message.result.message || 'Action completed'}`,
            timestamp: new Date()
          }]);
        }
        
        // Update current track if relevant
        if (message.action === 'play_track' || 
            message.action === 'get_currently_playing' || 
            message.action === 'next_track' || 
            message.action === 'previous_track' || 
            message.action === 'play_playlist' ||
            message.action === 'resume_playback' ||
            message.action === 'start_playback') {
          // Update immediately and after a short delay to ensure Spotify has updated
          updateCurrentlyPlaying();
          setTimeout(() => updateCurrentlyPlaying(), 2000);
        }
        break;
      
      case 'spotify_action_error':
        setMessages(prev => [...prev, {
          type: 'system',
          content: `❌ Failed to ${message.action.replace(/_/g, ' ')}: ${message.error}`,
          timestamp: new Date()
        }]);
        break;
      
      case 'info':
        setMessages(prev => [...prev, {
          type: 'system',
          content: `ℹ️ ${message.content}`,
          timestamp: new Date()
        }]);
        break;
      
      case 'error':
        setError(message.error);
        setIsTyping(false);
        break;
      
      default:
        console.log('Unknown OpenAI message type:', message.type);}  };

  // Start voice recording and connect to realtime session
  const startVoiceRecording = async () => {
    // Interrupt any ongoing audio playback when starting recording
    stopAllAudio();
    audioQueueTimeRef.current = 0;
    
    // Update avatar state
    setCurrentEmotion('listening');
    
    // Send cancellation message to backend to interrupt AI response
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'response.cancel'
      }));
    }

    try {
      // Check if already recording
      if (isRecording) {
        console.log('Already recording, ignoring start request');
        return;
      }

      console.log('Starting voice recording...');

      // First, check if we have microphone permission
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      console.log('Microphone permission status:', permissionStatus.state);

      // Request microphone access with more flexible constraints
      let stream;
      try {
        // Try with optimal settings first
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: { ideal: 24000 },
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (err) {
        console.log('Failed with ideal settings, trying basic audio:', err);
        // Fallback to basic audio if ideal settings fail
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true
        });
      }
        audioStreamRef.current = stream;
      audioBufferRef.current = []; // Reset buffer
      
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      console.log('Microphone access granted. Settings:', settings);
      console.log('Sample rate:', settings.sampleRate, 'Channel count:', settings.channelCount);
      
      // Initialize audio context for real-time processing with optimized settings
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ 
        sampleRate: 24000, // Set to OpenAI's expected sample rate
        latencyHint: 'interactive' // Optimize for low latency
      });
      
      await audioContextRef.current.resume(); // Ensure audio context is active
      
      // Load and register the audio worklet
      try {
        await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
        console.log('Audio worklet loaded successfully');
      } catch (error) {
        console.error('Failed to load audio worklet:', error);
        throw new Error('Audio worklet not supported or failed to load');
      }
      
      // Create audio worklet node
      audioWorkletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      
      // Track total audio sent
      let totalAudioDuration = 0;
      let audioChunkCount = 0;
      let pendingAudioQueue = [];
      let isProcessingQueue = false;
      
      // Process audio queue to prevent overwhelming WebSocket
      const processAudioQueue = async () => {
        if (isProcessingQueue || pendingAudioQueue.length === 0) return;
        
        isProcessingQueue = true;
        
        while (pendingAudioQueue.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const audioData = pendingAudioQueue.shift();
          
          try {
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: audioData
            }));
            
            // Small delay to prevent overwhelming the WebSocket
            await new Promise(resolve => setTimeout(resolve, 10));
          } catch (error) {
            console.error('Error sending audio data:', error);
            break;
          }
        }
        
        isProcessingQueue = false;
      };
      
      // Handle messages from the audio worklet
      audioWorkletNodeRef.current.port.onmessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'audio-data') {
          const { audioData, sampleRate, duration } = data;
          
          audioChunkCount++;
          totalAudioDuration += duration;
          
          // Calculate audio level for avatar animation
          const level = data.audioLevel || 0;
          setAudioLevel(level * 100); // Convert to 0-100 range
          
          // Queue audio for sending to reduce choppiness
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData.buffer)));
            pendingAudioQueue.push(base64Audio);
            
            // Process queue asynchronously
            processAudioQueue();
          } else {
            console.warn('WebSocket not ready, dropping audio chunk');
          }
        } else if (type === 'audio-data-empty') {
          console.log('Audio worklet reported empty buffer:', data.message);
        }
      };
        // Create media stream source and connect to worklet
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      console.log('Audio context state:', audioContextRef.current.state);
      console.log('Audio context sample rate:', audioContextRef.current.sampleRate);
      console.log('Media stream active:', stream.active);
      console.log('Audio tracks:', stream.getAudioTracks().map(track => ({
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted
      })));
      
      mediaStreamSourceRef.current.connect(audioWorkletNodeRef.current);
      
      // Test connection by connecting to destination briefly
      const testGain = audioContextRef.current.createGain();
      testGain.gain.value = 0.1; // Low volume for testing
      mediaStreamSourceRef.current.connect(testGain);
      testGain.connect(audioContextRef.current.destination);
      
      // Disconnect test connection after 1 second
      setTimeout(() => {
        if (testGain) {
          testGain.disconnect();
        }
      }, 1000);
      
      // Start recording in the worklet
      audioWorkletNodeRef.current.port.postMessage({
        type: 'start-recording',
        data: { sampleRate: audioContextRef.current.sampleRate }
      });
      
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setError(null);
      
      console.log('Voice recording started with AudioWorklet');
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      setError('Failed to access microphone or audio worklet not supported. Please check permissions and use a modern browser.');
    }
  };
  // Stop voice recording and commit audio buffer
  const stopVoiceRecording = () => {
    if (!isRecording) {
      console.log('Not recording, ignoring stop request');
      return;
    }

    const recordingDuration = Date.now() - recordingStartTime;
    console.log('Stopping recording. Duration:', recordingDuration, 'ms');
    
    // Update avatar state
    setCurrentEmotion('thinking');
    setAudioLevel(0);
    
    // Set recording to false first to stop audio processing
    setIsRecording(false);
    
    // Minimum recording time of 2000ms to ensure we have enough audio for OpenAI
    if (recordingDuration < 2000) {
      setError('Please record for at least 2 seconds to ensure enough audio data');
      cleanupAudioResources();
      return;
    }
    
    // Stop recording in the worklet
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.port.postMessage({
        type: 'stop-recording'
      });
    }
    
    // Clean up audio resources
    cleanupAudioResources();
    // Delay to ensure final audio data is sent before committing
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('Committing audio buffer to OpenAI...');
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.commit'
        }));
        
        // Request response from AI
        wsRef.current.send(JSON.stringify({
          type: 'response.create',
          response: {
            modalities: ["text", "audio"]
          }
        }));
      }
    }, 300); // Reduced delay since we now have better buffering
  };

  // Clean up audio resources
  const cleanupAudioResources = () => {
    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    // Disconnect audio worklet
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }
    
    // Disconnect media stream source
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };
  // Play audio response from OpenAI Realtime API
  const playAudioDelta = (audioData, offsetTime = 0) => {
    try {
      // Decode base64 PCM16 audio
      const audioBytes = atob(audioData);
      const audioArray = new Int16Array(audioBytes.length / 2);
      for (let i = 0; i < audioArray.length; i++) {
        audioArray[i] = (audioBytes.charCodeAt(i * 2) | (audioBytes.charCodeAt(i * 2 + 1) << 8));
      }
      // Ensure audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const context = audioContextRef.current;
      // Create buffer from PCM16
      const audioBuffer = context.createBuffer(1, audioArray.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < audioArray.length; i++) {
        channelData[i] = audioArray[i] / 32768.0;
      }
      // Create source and schedule playback with increased volume
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      // Create gain node for volume boost
      const gainNode = context.createGain();
      gainNode.gain.value = 1.5; // Increase volume
      source.connect(gainNode);
      gainNode.connect(context.destination);
      // Track source for interruption
      audioSourcesRef.current.push(source);
      source.start(context.currentTime + offsetTime);
      // Return buffer duration for scheduling next chunk
      return audioBuffer.duration;
    } catch (error) {
      console.error('Error playing audio response:', error);
      return 0;
    }
  };
  
  const sendMessage = async () => {
    // Interrupt any ongoing audio playback when sending a new message
    stopAllAudio();
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      // Send message via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        content: message
      }));
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Update currently playing track
  const updateCurrentlyPlaying = async () => {
    try {
      const response = await fetch('/api/playback/currently-playing', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.track) {
          // Only update if the track actually changed
          if (!currentTrack || currentTrack.id !== data.track.id) {
            setCurrentTrack(data.track);
            console.log('Updated currently playing track:', data.track.name);
          }
        } else {
          // No track currently playing
          if (currentTrack) {
            setCurrentTrack(null);
            console.log('No track currently playing');
          }
        }
      } else if (response.status === 404) {
        // No track playing or Spotify not active
        if (currentTrack) {
          setCurrentTrack(null);
        }
      }
    } catch (error) {
      console.error('Error updating currently playing:', error);
      // Don't clear the current track on network errors
    }
  };

  // Play a playlist via the voice agent
  const playPlaylist = async (playlistUri, playlistName) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Voice agent not connected');
      return;
    }

    try {
      // Send playlist play request via WebSocket to the voice agent
      wsRef.current.send(JSON.stringify({
        type: 'function_call',
        function: {
          name: 'play_playlist',
          arguments: JSON.stringify({
            playlistUri: playlistUri
          })
        }
      }));

      // Add user message to show action
      setMessages(prev => [...prev, {
        type: 'user',
        content: `🎵 Playing "${playlistName}" playlist`,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error playing playlist:', error);
      setError('Failed to play playlist');
    }
  };

  // Terminate session
  const terminateSession = async () => {
    // Stop recording if active
    if (isRecording) {
      setIsRecording(false);
      cleanupAudioResources();
    }
    
    if (sessionId) {
      try {
        await fetch(`/api/voice-agent/sessions/${sessionId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Error terminating session:', error);
      }
    }
      if (wsRef.current) {
      wsRef.current.close();
    }
    
    setIsConnected(false);
    setSessionId(null);
    setMessages([]);
    setCurrentTrack(null);
  };  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        setIsRecording(false);
        cleanupAudioResources();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  // Update currently playing on mount and set up periodic polling
  useEffect(() => {
    if (isConnected) {
      updateCurrentlyPlaying();
      
      // Set up polling every 5 seconds to check for track changes
      const pollingInterval = setInterval(() => {
        updateCurrentlyPlaying();
      }, 5000);
      
      return () => clearInterval(pollingInterval);
    }
  }, [isConnected]);

  // Auto-scroll messages container to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-hide instructions modal after connection is established
  useEffect(() => {
    if (isConnected && showInstructions) {
      // Give user a moment to see the modal, then auto-close it
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 3000); // Hide after 3 seconds once connected
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, showInstructions]);

  // Update audio level for avatar visualization
  const updateAudioLevel = () => {
    setAudioLevel(audioLevelRef.current);
    requestAnimationFrame(updateAudioLevel);
  };

  // Update emotion based on conversation context
  const updateEmotion = (messageType, content = '') => {
    if (messageType === 'playlist_created') {
      setCurrentEmotion('excited');
      setTimeout(() => setCurrentEmotion('happy'), 3000);
    } else if (isRecording) {
      setCurrentEmotion('listening');
    } else if (isProcessing) {
      setCurrentEmotion('thinking');
    } else if (messageType === 'agent' && content.includes('!')) {
      setCurrentEmotion('excited');
      setTimeout(() => setCurrentEmotion('neutral'), 2000);
    } else if (messageType === 'system') {
      setCurrentEmotion('thinking');
      setTimeout(() => setCurrentEmotion('neutral'), 1500);
    } else {
      setCurrentEmotion('neutral');
    }
  };

  // Start audio level monitoring
  useEffect(() => {
    if (isConnected) {
      updateAudioLevel();
    }
  }, [isConnected]);

  // Audio level decay effect
  useEffect(() => {
    let decayInterval;
    
    if (audioLevel > 0 && !isRecording && !avatarSpeaking) {
      decayInterval = setInterval(() => {
        setAudioLevel(prev => Math.max(0, prev * 0.9)); // Decay by 10% each interval
      }, 50);
    }
    
    return () => {
      if (decayInterval) clearInterval(decayInterval);
    };
  }, [audioLevel, isRecording, avatarSpeaking]);

  // Reset audio level when recording stops
  useEffect(() => {
    if (!isRecording) {
      setTimeout(() => setAudioLevel(0), 1000); // Reset after 1 second
    }
  }, [isRecording]);

  return (
    <div className="voice-agent">
      <div className="voice-agent-header">
        
        <div className="header-controls">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'chat' ? 'active' : ''}`}
              onClick={() => setViewMode('chat')}
            >
              💬 Chat
            </button>
            <button
              className={`toggle-btn ${viewMode === 'avatar' ? 'active' : ''}`}
              onClick={() => setViewMode('avatar')}
            >
              🤖 Avatar
            </button>
          </div>
          <div className="connection-status">
            {isConnected ? (
              <span className="status connected">🟢 Connected</span>
            ) : (
              <span className="status disconnected">🔴 Disconnected</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {currentTrack && (
        <div className="current-track">
          <div className="track-info">
            <img src={currentTrack.image} alt={currentTrack.name} />
            <div>
              <div className="track-name">{currentTrack.name}</div>
              <div className="track-artist">{currentTrack.artists.join(', ')}</div>
            </div>
            {/* Uncomment if track updates are still poroblematic */}
            {/* <button 
              className="refresh-track-btn" 
              onClick={updateCurrentlyPlaying}
              title="Refresh currently playing track"
            >
              🔄
            </button> */}
          </div>
        </div>
      )}

      {/* Conditional rendering based on view mode */}
      {viewMode === 'avatar' ? (
        <div className="avatar-view">
          <VoiceAvatar
            isListening={isRecording}
            isSpeaking={avatarSpeaking}
            audioLevel={audioLevel}
            currentEmotion={currentEmotion}
          />
        </div>
      ) : (
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-content">
              {message.type === 'playlist_created' ? (
                <div className="playlist-created-message">
                  <div className="playlist-header">
                    <span className="playlist-icon">🎵</span>
                    <h4>Playlist Created!</h4>
                  </div>
                  <div className="playlist-details">
                    <h5>{message.playlistData.name}</h5>
                    <p className="playlist-description">{message.playlistData.description}</p>
                    <p className="playlist-stats">{message.playlistData.numberOfSongs} songs</p>
                    <div className="playlist-actions">
                      <a 
                        href={message.playlistData.spotifyUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn spotify-link"
                      >
                        🎧 Open in Spotify
                      </a>
                      {message.playlistData.spotifyPlaylistUri && (
                        <button
                          className="btn play-playlist"
                          onClick={() => playPlaylist(message.playlistData.spotifyPlaylistUri, message.playlistData.name)}
                          title="Play this playlist now"
                        >
                          ▶️ Play Now
                        </button>
                      )}
                    </div>
                    {message.playlistData.songs && message.playlistData.songs.length > 0 && (
                      <details className="playlist-songs">
                        <summary>View Songs ({message.playlistData.songs.length})</summary>
                        <ul>
                          {message.playlistData.songs.slice(0, 5).map((song, idx) => (
                            <li key={idx}>
                              {typeof song === 'string' ? song : `${song.song} by ${song.artist}`}
                            </li>
                          ))}
                          {message.playlistData.songs.length > 5 && (
                            <li className="more-songs">...and {message.playlistData.songs.length - 5} more</li>
                          )}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              ) : (
                message.content
              )}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}        {isTyping && (
          <div className="message agent">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      )}

      {isConnected && viewMode === 'chat' && (
        <div className="message-input">
          <div className="input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message about music here... (e.g., 'Play some jazz music' or 'What's currently playing?')"
              disabled={isTyping}
              rows={3}
            />
            <button
              className="btn send"
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isTyping}
            >
              {isTyping ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}

      <div className="voice-controls">
        {!isConnected ? (
          <button 
            className="btn primary"
            onClick={initializeSession}
            disabled={isInitializing}
          >
            {isInitializing ? 'Initializing...' : '� Start Music Agent'}
          </button>        ) : (
          <div className="control-buttons">
            {!isRecording ? (
              <button
                className="btn record"
                onClick={startVoiceRecording}
                disabled={isProcessing || isPlaying}                title="Click to start recording (speak for at least 0.5 seconds)"
              >
                🎤 Start Recording
              </button>
            ) : (
              <button
                className="btn stop"
                onClick={stopVoiceRecording}
                title="Stop recording and send to AI"
              >
                ⏸️ Stop Recording ({recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0}s)
              </button>
            )}
            <button
              className="btn secondary"
              onClick={terminateSession}
            >
              🛑 Stop Agent
            </button>
          </div>
        )}
      </div>

      {/* Help button */}
      <div className="help-section">
        <button 
          className="btn help-btn"
          onClick={() => setShowInstructions(true)}
          title="Show instructions"
        >
          ❓ How to Use
        </button>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="modal-overlay" onClick={() => setShowInstructions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎵 How to Use MELODY Voice Agent</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowInstructions(false)}
                title="Close instructions"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="instruction-section">
                <p>
                  💡 <strong>How to use:</strong> Have a natural conversation with MELODY! Use voice or text to chat about music. 
                  The AI will respond with voice and can control your Spotify during the conversation.
                </p>
              </div>
              <div className="instruction-section">
                <p>
                  🎵 <strong>Examples:</strong> "Play some jazz music", "What's currently playing?", "I'm feeling sad, play something uplifting", 
                  "Skip this song and play something more energetic", "Tell me about this artist", "Create a workout playlist", 
                  "Make me a chill study playlist with 15 songs", "Generate a road trip playlist and play it"
                </p>
              </div>
              <div className="instruction-section">
                <p>
                  🎤 <strong>Voice Conversation:</strong> Click "Start Recording" to speak naturally to MELODY. The AI will respond with voice 
                  and can perform actions like playing music, skipping songs, etc. Click "Stop Recording" when you're done speaking.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn primary"
                onClick={() => setShowInstructions(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAgent;
