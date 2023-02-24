const speech = require("@google-cloud/speech");
const express = require("express");
const app = express();
const expressWs = require("express-ws")(app);

const speechClient = new speech.SpeechClient();

let recognizeStream;

const WebSocketState = {
  /** The connection is not yet open. */
  CONNECTING: 0,
  /** The connection is open and ready to communicate. */
  OPEN: 1,
  /** The connection is in the process of closing. */
  CLOSING: 2,
  /** The connection is closed. */
  CLOSED: 3,
};

function endRecognizeStreamIfOneExists() {
  if (recognizeStream) {
    recognizeStream.end();
    recognizeStream = null;
  }
}

function handleSpeechRecognition(ws, data, locale) {
  const buffer = data;

  if (!recognizeStream) {
    const streamingRecognizeRequest = {
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 44100,
        languageCode: locale,
      },
      singleUtterance: true,
      interimResults: true,
      verbose: true,
    };

    recognizeStream = speechClient
      .streamingRecognize(streamingRecognizeRequest)
      .on("error", (error) => {
        endRecognizeStreamIfOneExists();

        if (ws.readyState === WebSocketState.OPEN) {
          ws.send(JSON.stringify({ error: error.message }));
        }
      })
      .on("data", (data) => {
        if (data.results && data.results[0]) {
          ws.send(JSON.stringify(data.results[0]));
        }
      });
  }

  recognizeStream.write(buffer);
}

app.ws("/ws", (ws, req) => {
  ws.on("message", async (data) => {
    handleSpeechRecognition(ws, data, locale);
  });

  ws.on("close", (ws) => endRecognizeStreamIfOneExists());
});

app.listen(process.env.PORT || 8080);

module.exports = app;
