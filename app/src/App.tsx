import React, { useState, useEffect } from 'react';
import './App.css';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import Kick01 from './sounds/kicks/Kick_01.wav';
import Snare01 from './sounds/snares/Snare_01.wav';
import Hihat01 from './sounds/hihats/Hihat_01.wav';

let kick_sample: null | AudioBuffer = null;
let snare_sample: null | AudioBuffer = null;
let hihat_sample: null | AudioBuffer = null;

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

function scheduleSample(audioContext: AudioContext, audioBuffer: AudioBuffer, time: number) {
  const sampleSource = new AudioBufferSourceNode(audioContext, {
    buffer: audioBuffer,
    playbackRate: 1,
  });
  sampleSource.connect(audioContext.destination);
  sampleSource.start(time);
  return sampleSource;
}

let playing: { [key: string]: boolean} = {};
let bpm = 124;
let nextNoteTime: { [key: string]: number} = {};

let wakeUpEvery = 25; //ms
let scheduleWindow = 0.100; //s

let instruments: { [key: string]: AudioBuffer} = {};

function wakeUp(instrument: string) {
  console.log(`Waking up ${instrument}... `);
  if (playing[instrument]) {
    const now = audioCtx.currentTime;
    console.log(`${now} ${nextNoteTime[instrument]}`)

    while (now <= nextNoteTime[instrument] && nextNoteTime[instrument] < now + scheduleWindow) {
      scheduleSample(audioCtx, instruments[instrument], nextNoteTime[instrument]);

      var secondsPerBeat = 60.0 / bpm;
      console.log(secondsPerBeat)
      nextNoteTime[instrument] += secondsPerBeat;
    }
    window.setTimeout(() => wakeUp(instrument), wakeUpEvery)
  }
}

function scheduleKick(time: number) {
  // FIXME: rm "as"
  scheduleSample(audioCtx, kick_sample as AudioBuffer, time);
}

function playSnare() {
  // FIXME: rm "as"
  scheduleSample(audioCtx, snare_sample as AudioBuffer, 0);
}

function playHihat() {
  // FIXME: rm "as"
  scheduleSample(audioCtx, hihat_sample as AudioBuffer, 0);
}

async function loadSamples() {
  console.log("Loading samples...");

  kick_sample = await setupSample(audioCtx, Kick01);
  snare_sample = await setupSample(audioCtx, Snare01);
  hihat_sample = await setupSample(audioCtx, Hihat01);

  instruments["kick"] = kick_sample;
  instruments["snare"] = snare_sample;
  instruments["hihat"] = hihat_sample;
}

function startPlaying(instrument: string) {
  if (playing[instrument] !== true) {
    console.log("Starting to play " + instrument);
    playing[instrument] = true;
    nextNoteTime[instrument] = audioCtx.currentTime
    wakeUp(instrument);
  }
}

function stopPlaying(instrument: string) {
  console.log("Stop playing " + instrument);
  playing[instrument] = false;
}

window.addEventListener("keydown", (event) => {
  console.log("Key down" + event.keyCode);
  if (event.keyCode === 'A'.charCodeAt(0)) {
    startPlaying("kick");
  }
  else if (event.keyCode === 'S'.charCodeAt(0)) {
    startPlaying("snare");
  }
  else if (event.keyCode === 'D'.charCodeAt(0)) {
    startPlaying("hihat");
  }
});

window.addEventListener("keyup", (event) => {
  console.log("Key up" + event.keyCode);
  if (event.keyCode === 'A'.charCodeAt(0)) {
    stopPlaying("kick");
  }
  else if (event.keyCode === 'S'.charCodeAt(0)) {
    stopPlaying("snare");
  }
  else if (event.keyCode === 'D'.charCodeAt(0)) {
    stopPlaying("hihat");
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
      <header className="App-header" style={{display: 'flex'}}>
        <h1 style={{color: "white", marginBottom: 10}}>Vibe Summonerz</h1>
        <div style={{color: "white", marginBottom: 10}}>Expect bugs</div>
        <Button style={{marginBottom: 10}} variant="contained" onClick={() => scheduleKick(0)}>Kick (A)</Button>
        <Button style={{marginBottom: 10}} variant="contained" onClick={() => playSnare()}>Snare (S)</Button>
        <Button style={{marginBottom: 10}} variant="contained" onClick={() => playHihat()}>Hihat (D)</Button>
      </header>
    </div>
  );
}
