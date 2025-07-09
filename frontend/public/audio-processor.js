// Audio worklet processor for real-time audio processing
// This replaces the deprecated ScriptProcessorNode

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.sampleRate = 44100; // Will be updated by main thread
    this.targetSampleRate = 24000; // OpenAI preferred rate
    this.bufferDuration = 0.2; // 200ms buffer for smoother audio
    this.maxBufferSize = Math.floor(this.targetSampleRate * this.bufferDuration);
    this.internalBuffer = [];
    this.totalBufferedSamples = 0;
    this.lastSendTime = 0;
    this.minSendInterval = 150; // Minimum 150ms between sends
    
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'start-recording':
          this.isRecording = true;
          this.internalBuffer = [];
          this.totalBufferedSamples = 0;
          this.lastSendTime = currentTime;
          this.sampleRate = data.sampleRate || 44100;
          console.log(`[AudioProcessor] Recording started. Sample Rate: ${this.sampleRate}`);
          break;
          
        case 'stop-recording':
          this.isRecording = false;
          console.log('[AudioProcessor] Recording stopped. Sending final buffer.');
          this.sendBufferedAudio(true);
          break;
          
        default:
          console.warn('[AudioProcessor] Unknown message type:', type);
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    if (!this.isRecording) {
      return true; // Keep processor alive
    }
    
    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }
    const inputChannelData = input[0]; // Assuming mono audio
    if (!inputChannelData || inputChannelData.length === 0) {
      return true;
    }

    // Buffer audio data more efficiently
    this.internalBuffer.push(new Float32Array(inputChannelData));
    this.totalBufferedSamples += inputChannelData.length;

    // Send data based on time interval and buffer size to reduce choppiness
    const now = currentTime;
    const timeSinceLastSend = (now - this.lastSendTime) * 1000; // Convert to ms
    const hasEnoughData = this.totalBufferedSamples >= this.maxBufferSize * 0.5; // 50% of max buffer
    const hasMinInterval = timeSinceLastSend >= this.minSendInterval;
    
    if (hasEnoughData && hasMinInterval) {
      this.sendBufferedAudio(false);
      this.lastSendTime = now;
    }

    return true; // Keep processor alive
  }

  sendBufferedAudio(isFinal = false) {
    if (this.internalBuffer.length === 0) {
      if (isFinal) {
        this.port.postMessage({
          type: 'audio-data-empty',
          data: { message: 'No audio data captured in worklet buffer.' }
        });
      }
      return;
    }

    // Combine all Float32Arrays in the buffer more efficiently
    const combinedFloat32Buffer = new Float32Array(this.totalBufferedSamples);
    let offset = 0;
    for (let i = 0; i < this.internalBuffer.length; i++) {
      const chunk = this.internalBuffer[i];
      combinedFloat32Buffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Calculate audio level for avatar animation (optimized)
    let sum = 0;
    const step = Math.max(1, Math.floor(this.totalBufferedSamples / 1000)); // Sample every nth value for performance
    for (let i = 0; i < this.totalBufferedSamples; i += step) {
      sum += Math.abs(combinedFloat32Buffer[i]);
    }
    const audioLevel = sum / (this.totalBufferedSamples / step);
    
    // Clear the buffer
    this.internalBuffer.length = 0;
    this.totalBufferedSamples = 0;

    // Convert Float32 to PCM16 more efficiently
    const pcm16Data = new Int16Array(combinedFloat32Buffer.length);
    for (let i = 0; i < combinedFloat32Buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, combinedFloat32Buffer[i]));
      pcm16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    // Resample to targetSampleRate if needed
    let finalBuffer = pcm16Data;
    if (this.sampleRate !== this.targetSampleRate) {
      finalBuffer = this.resampleAudio(pcm16Data, this.sampleRate, this.targetSampleRate);
    }

    if (finalBuffer.length === 0) {
        console.warn('[AudioProcessor] Final buffer is empty after processing.');
        if (isFinal) {
          this.port.postMessage({
              type: 'audio-data-empty',
              data: { message: 'Final buffer empty after processing in worklet.' }
          });
        }
        return;
    }
    
    this.port.postMessage({
      type: 'audio-data',
      data: {
        audioData: finalBuffer,
        sampleRate: this.targetSampleRate,
        duration: (finalBuffer.length / this.targetSampleRate) * 1000,
        audioLevel: audioLevel
      }
    });
  }
  
  // Improved resampling with linear interpolation for better quality
  resampleAudio(inputBuffer, inputSampleRate, outputSampleRate) {
    if (inputSampleRate === outputSampleRate) {
      return inputBuffer;
    }
    if (!inputBuffer || inputBuffer.length === 0) {
        return new Int16Array(0);
    }
    
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.floor(inputBuffer.length / ratio);
    if (outputLength === 0) {
        return new Int16Array(0);
    }
    const outputBuffer = new Int16Array(outputLength);
    
    // Linear interpolation for smoother resampling
    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio;
      const inputIndexFloor = Math.floor(inputIndex);
      const inputIndexCeil = Math.min(inputIndexFloor + 1, inputBuffer.length - 1);
      
      if (inputIndexFloor === inputIndexCeil) {
        outputBuffer[i] = inputBuffer[inputIndexFloor];
      } else {
        const fraction = inputIndex - inputIndexFloor;
        const sample1 = inputBuffer[inputIndexFloor];
        const sample2 = inputBuffer[inputIndexCeil];
        outputBuffer[i] = Math.round(sample1 + (sample2 - sample1) * fraction);
      }
    }
    return outputBuffer;
  }
}

registerProcessor('audio-processor', AudioProcessor);
