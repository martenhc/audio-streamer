## Audio stream implementation with Audio Worklet

As `AudioContext`'s [createScriptProcessor](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createScriptProcessor) has been deprecated, I have worked on an implementation of the [AudioWorkletNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode) interface to create a class that can handle audio streaming to a websocket.

#### Sample usage

```typescript
const webSocketClient = new WebSocket('your_wss_url');

...

const stream = new AudioStream({
  handleStart: yourOptionalStartHandlerFunction,
  handleStop: yourOptionalStopHandlerFunction,
  handleStream: sampleHandleStreamFunction,
});

...

const sampleHandleStreamFunction = (buffer: Int16Array) => {
  const socketIsClosed = webSocketClient.readyState === webSocketClient.CLOSED;
  const socketIsConnecting = webSocketClient.readyState === webSocketClient.CONNECTING;

  if (socketIsConnecting) return;

  if (socketIsClosed) {
    connectSocket();
  } else {
    webSocketClient.send(buffer);
  }
}
```

This particular code has been tested with [Google's Speech-to-Text API](https://cloud.google.com/speech-to-text).
You can find its implementation in the `/sever/server.js` file.
