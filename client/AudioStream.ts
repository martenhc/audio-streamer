interface StreamConstuctor {
  handleStart: () => void;
  handleStop: () => void;
  handleStream: (buffer: Int16Array) => void;
}

export default class AudioStream {
  private stream: MediaStream | null;
  private audioContext: AudioContext | null;
  private source: MediaStreamAudioSourceNode | null;
  private recorderNode: AudioWorkletNode | null;
  private handleStart?: () => void;
  private handleStop?: () => void;
  private handleStream: (buffer: Int16Array) => void;

  constructor({ handleStart, handleStop, handleStream }: StreamConstuctor) {
    this.handleStart = handleStart;
    this.handleStop = handleStop;
    this.handleStream = handleStream;
  }

  startListening(stream: MediaStream) {
    this.audioContext = new AudioContext();
    this.stream = stream;
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    this.audioContext.audioWorklet
      .addModule("/recorderWorkletProcessor.js")
      .then(() => {
        this.recorderNode = new window.AudioWorkletNode(
          this.audioContext as AudioContext,
          "recorder-worklet"
        );

        this.recorderNode.port.onmessage = ({
          data,
        }: {
          data: Float32Array;
        }) => {
          this.streamAudio(data);
        };

        this.source
          ?.connect(this.recorderNode)
          .connect((this.audioContext as AudioContext).destination);
        this.handleStart && this.handleStart();
      });
  }

  stopListening() {
    if (this.stream) {
      this.stream.getTracks()[0].stop();
      this.stream = null;
    }

    this.source?.disconnect(this.recorderNode as AudioWorkletNode);
    this.source = null;
    this.audioContext &&
      this.recorderNode?.disconnect(this.audioContext.destination);
    this.recorderNode = null;
    this.audioContext?.close();
    this.audioContext = null;

    this.handleStop && this.handleStop();
  }

  streamAudio(data: Float32Array) {
    const output = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 32767;
    }

    this.handleStream(output);
  }
}
