import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import Kick01 from './sounds/kicks/Kick_01.wav';
import Snare01 from './sounds/snares/Snare_01.wav';

let [kick_sample, snare_sample] = [null, null];

const audioCtx = new AudioContext();

async function getFile(audioContext, filepath) {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

async function setupSample(audioContext, filePath) {
  return await getFile(audioContext, filePath);
}

function playSample(audioContext, audioBuffer, time) {
  const sampleSource = new AudioBufferSourceNode(audioContext, {
    buffer: audioBuffer,
    playbackRate: 1,
  });
  sampleSource.connect(audioContext.destination);
  sampleSource.start(time);
  return sampleSource;
}

function playKick() {
  playSample(audioCtx, kick_sample, 0);
}

function playSnare() {
  playSample(audioCtx, snare_sample, 0);
}

async function loadSamples() {
  console.log("Loading samples...");

  kick_sample = await setupSample(audioCtx, Kick01);
  snare_sample = await setupSample(audioCtx, Snare01);
}

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
  }, [audioCtx]);

  if (!appReady) {
    return <Box sx={{ display: 'flex' }}><CircularProgress /></Box>;
  }
  return (
    <div className="App">
      <header className="App-header">
        <Button variant="contained" onClick={() => playKick()}>Kick</Button>
        <Button variant="contained" onClick={() => playSnare()}>Snare</Button>
      </header>
    </div>
  );
}
