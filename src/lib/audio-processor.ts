// Advanced audio processing for speech recognition

interface AudioProcessorOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  confidenceThreshold?: number;
}

export class AudioProcessor {
  private recognition: any;
  private isRecording: boolean = false;
  private options: AudioProcessorOptions;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private noiseThreshold: number = 0.01; // Default noise threshold

  constructor(options: AudioProcessorOptions = {}) {
    this.options = {
      language: options.language || "en-US",
      continuous: options.continuous !== undefined ? options.continuous : true,
      interimResults:
        options.interimResults !== undefined ? options.interimResults : true,
      maxAlternatives: options.maxAlternatives || 1,
      confidenceThreshold: options.confidenceThreshold || 0.7,
    };
  }

  public async initialize(): Promise<boolean> {
    if (!("webkitSpeechRecognition" in window)) {
      throw new Error("Speech recognition is not supported in this browser.");
    }

    try {
      // Initialize audio context for noise detection
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      // Calibrate noise threshold
      await this.calibrateNoiseThreshold();

      // Initialize speech recognition
      this.recognition = new window.webkitSpeechRecognition();
      this.recognition.continuous = this.options.continuous;
      this.recognition.interimResults = this.options.interimResults;
      this.recognition.lang = this.options.language;
      this.recognition.maxAlternatives = this.options.maxAlternatives;

      return true;
    } catch (error) {
      console.error("Error initializing audio processor:", error);
      return false;
    }
  }

  private calibrateNoiseThreshold(): Promise<void> {
    if (!this.analyser) return Promise.resolve();

    return new Promise((resolve) => {
      const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);
      let samples = 0;
      let sum = 0;

      const sampleNoise = () => {
        this.analyser!.getByteFrequencyData(dataArray);
        const average =
          dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        sum += average;
        samples++;

        if (samples < 10) {
          requestAnimationFrame(sampleNoise);
        } else {
          // Set noise threshold to 1.2x the average background noise (lower than before)
          this.noiseThreshold = (sum / samples / 255) * 1.2;
          // Ensure the threshold is not too high
          this.noiseThreshold = Math.min(this.noiseThreshold, 0.1);
          console.log("Calibrated noise threshold:", this.noiseThreshold);
          resolve();
        }
      };

      sampleNoise();
    });
  }

  public start(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: any) => void,
  ): void {
    if (!this.recognition) {
      throw new Error(
        "Speech recognition not initialized. Call initialize() first.",
      );
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      // Process results with noise filtering
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        // Check if audio level is above noise threshold
        if (this.analyser) {
          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((acc, val) => acc + val, 0) /
            dataArray.length /
            255;

          // Log audio levels for debugging
          console.log(
            "Audio level:",
            average,
            "Threshold:",
            this.noiseThreshold,
          );

          // Skip processing if below noise threshold, but with a very low threshold
          if (average < this.noiseThreshold && average < 0.01) continue;
        }

        // Accept results with lower confidence threshold
        const confidence = event.results[i][0].confidence || 0;
        const transcript = event.results[i][0].transcript;

        // Log confidence for debugging
        console.log(
          "Confidence:",
          confidence,
          "Threshold:",
          this.options.confidenceThreshold,
        );

        if (
          confidence > this.options.confidenceThreshold! ||
          confidence === 0
        ) {
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = onError;

    this.recognition.onend = () => {
      if (this.isRecording) {
        // Add a small delay before restarting to avoid rapid restarts
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (e) {
            console.error("Error restarting recognition:", e);
            this.isRecording = false;
            onError(e);
          }
        }, 300);
      }
    };

    this.isRecording = true;
    this.recognition.start();
  }

  public stop(): void {
    if (this.recognition) {
      this.isRecording = false;
      this.recognition.stop();
    }

    // Clean up audio resources
    if (this.microphone) {
      this.microphone.disconnect();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
  }

  public isSupported(): boolean {
    return "webkitSpeechRecognition" in window;
  }
}
