// Audio worklet processor for real-time audio processing
// This replaces the deprecated ScriptProcessorNode

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.sampleRate = 44100; // Will be updated by main thread
    this.targetSampleRate = 24000; // OpenAI preferred rate
    this.minBufferSize = Math.floor(this.targetSampleRate * 0.1); // 100ms of audio at target rate
    this.internalBuffer = [];
    
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'start-recording':
          this.isRecording = true;
          this.internalBuffer = [];
          this.sampleRate = data.sampleRate || 44100;
          console.log(`[AudioProcessor] Recording started. Sample Rate: ${this.sampleRate}`);
          break;
          
        case 'stop-recording':
          this.isRecording = false;
          console.log('[AudioProcessor] Recording stopped. Sending final buffer.');
          this.sendBufferedAudio();
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

    // Buffer all audio data (including silence) to ensure sufficient buffer length
    this.internalBuffer.push(new Float32Array(inputChannelData));

    // Send data if buffer is large enough (e.g., every 200ms)
    // This logic might need adjustment based on how frequently 'process' is called
    // and the size of inputChannelData.
    // For now, let's accumulate and send on 'stop-recording' or if a certain size is met.
    // A more robust approach would be to check the total buffered duration.
    // For now, flush at 200ms.
    const bufferedLength = this.internalBuffer.reduce((sum, arr) => sum + arr.length, 0);
    if (bufferedLength > this.sampleRate * 0.1) { // Approx 100ms of audio
         // console.log('[AudioProcessor] Buffer threshold reached, sending chunk.');
         this.sendBufferedAudio();
     }

    return true; // Keep processor alive
  }

  sendBufferedAudio() {
    if (this.internalBuffer.length === 0) {
      // console.log('[AudioProcessor] sendBufferedAudio called, but buffer is empty.');
      this.port.postMessage({
        type: 'audio-data-empty',
        data: { message: 'No audio data captured in worklet buffer.' }
      });
      return;
    }

    // Combine all Float32Arrays in the buffer
    const totalSamples = this.internalBuffer.reduce((sum, arr) => sum + arr.length, 0);
    const combinedFloat32Buffer = new Float32Array(totalSamples);
    let offset = 0;
    this.internalBuffer.forEach(chunk => {
      combinedFloat32Buffer.set(chunk, offset);
      offset += chunk.length;
    });
    
    // Calculate audio level for avatar animation
    let sum = 0;
    for (let i = 0; i < totalSamples; i++) {
      sum += Math.abs(combinedFloat32Buffer[i]);
    }
    const audioLevel = totalSamples > 0 ? (sum / totalSamples) : 0;
    
    this.internalBuffer = []; // Clear the buffer

    // Convert Float32 to PCM16
    const pcm16Data = new Int16Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
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
        this.port.postMessage({
            type: 'audio-data-empty',
            data: { message: 'Final buffer empty after processing in worklet.' }
        });
        return;
    }
    
    // console.log(`[AudioProcessor] Sending audio data. Samples: ${finalBuffer.length}, Original SR: ${this.sampleRate}, Target SR: ${this.targetSampleRate}`);
    this.port.postMessage({
      type: 'audio-data',
      data: {
        audioData: finalBuffer, // This is Int16Array
        sampleRate: this.targetSampleRate,
        duration: (finalBuffer.length / this.targetSampleRate) * 1000,
        audioLevel: audioLevel // Add audio level for avatar animation
      }
    });
  }
  
  // Resample audio to target sample rate (simplified)
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
    
    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio;
      // Simple nearest-neighbor resampling for now
      outputBuffer[i] = inputBuffer[Math.floor(inputIndex)];
    }
    return outputBuffer;
  }
}

registerProcessor('audio-processor', AudioProcessor);
