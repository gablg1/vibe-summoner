import React, { useState, useEffect } from 'react';
import './App.css';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import Kick01 from './sounds/kicks/Kick_01.wav';
import Snare01 from './sounds/snares/Snare_01.wav';

let kick_sample: null | AudioBuffer = null;
let snare_sample: null | AudioBuffer = null;

const audioCtx = new AudioContext();

async function getFile(audioContext: AudioContext, filepath: string) {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

async function setupSample(audioContext: AudioContext, filePath: string) {
  return await getFile(audioContext, filePath);
}

function playSample(audioContext: AudioContext, audioBuffer: AudioBuffer, time: number) {
  const sampleSource = new AudioBufferSourceNode(audioContext, {
    buffer: audioBuffer,
    playbackRate: 1,
  });
  sampleSource.connect(audioContext.destination);
  sampleSource.start(time);
  return sampleSource;
}

function playKick() {
  // FIXME: rm "as"
  playSample(audioCtx, kick_sample as AudioBuffer, 0);
}

function playSnare() {
  // FIXME: rm "as"
  playSample(audioCtx, snare_sample as AudioBuffer, 0);
}

async function loadSamples() {
  console.log("Loading samples...");

  kick_sample = await setupSample(audioCtx, Kick01);
  snare_sample = await setupSample(audioCtx, Snare01);
}

window.addEventListener("keydown", (event) => {
  console.log("Key pressed " + event.keyCode);
  if (event.keyCode === 'A'.charCodeAt(0)) {
    playKick();
  }
  else if (event.keyCode === 'S'.charCodeAt(0)) {
    playSnare();
  }
});

export default App;

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let ignore = false;

    loadSamples().then(() => {
      if (!ignore) {
        setAppReady(true)
      }
    })
  	return () => {
  	  ignore = false;
  	};
  }, []);

  if (!appReady) {
    return <Box sx={{ display: 'flex' }}><CircularProgress /></Box>;
  }
  return (
    <div className="App">
      <header className="App-header">
        <Button variant="contained" onClick={() => playKick()}>Kick (A)</Button>
        <Button variant="contained" onClick={() => playSnare()}>Snare (S)</Button>
      </header>
    </div>
  );
}