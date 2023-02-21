import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import './App.css';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';

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
let nextNoteTime: { [key: string]: number} = {};

let wakeUpEvery = 25; //ms
let scheduleWindow = 0.100; //s

let instruments: { [key: string]: AudioBuffer} = {};

const debugWakeUpOn = false;
function debugWakeUp(s: string) {
  if (debugWakeUpOn) {
    console.log(s);
  }
}

function wakeUp(instrument: string) {
  debugWakeUp(`Waking up ${instrument}... `);

  if (playing[instrument]) {
    const now = audioCtx.currentTime;
    debugWakeUp(`${now} ${nextNoteTime[instrument]}`)

    while (now <= nextNoteTime[instrument] && nextNoteTime[instrument] < now + scheduleWindow) {
      scheduleSample(audioCtx, instruments[instrument], nextNoteTime[instrument]);

      var secondsPerBeat = inferredSecondsToNextBeat;
      debugWakeUp(`Seconds per beat: ${secondsPerBeat}`)
      nextNoteTime[instrument] += secondsPerBeat;
    }
    window.setTimeout(() => wakeUp(instrument), wakeUpEvery)
  }
}

function playInstrument(instrument: string) {
  scheduleSample(audioCtx, instruments[instrument], 0);
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

let lastTimePlayed: { [key: string]: number} = {};
let inferredSecondsToNextBeat = 60 / 124;
let minSecondsToNextBeat = 0.1;
let maxSecondsToNextBeat = 1.5;

function startPlaying(instrument: string) {
  if (playing[instrument] !== true) {
    console.log("Starting to play " + instrument);
    const now = audioCtx.currentTime;

    playing[instrument] = true;

    if (instrument in lastTimePlayed) {
      inferredSecondsToNextBeat = now - lastTimePlayed[instrument];

      // Put beat within human likeable range (~60 to ~180 BPM)
      while (inferredSecondsToNextBeat < minSecondsToNextBeat) {
        inferredSecondsToNextBeat *= 2;
      }

      while (inferredSecondsToNextBeat > maxSecondsToNextBeat) {
        inferredSecondsToNextBeat /= 2;
      }

      console.log("Inferred BPM " + 60 / inferredSecondsToNextBeat);
    }

    lastTimePlayed[instrument] = audioCtx.currentTime;
    nextNoteTime[instrument] = audioCtx.currentTime;
    wakeUp(instrument);
  }
}

function stopPlaying(instrument: string) {
  if (playing[instrument]) {
    console.log("Stop playing " + instrument);
    playing[instrument] = false;
  }
}

window.addEventListener("keydown", (event) => {
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
  }, [inferredSecondsToNextBeat]);

  if (!appReady) {
    return <Box sx={{ display: 'flex' }}><CircularProgress /></Box>;
  }
  return (
    <div className="App">
      <header className="App-header" style={{display: 'flex'}}>
        <h1 style={{color: "white", marginBottom: 10}}>Vibe Summonerz</h1>
        <div style={{color: "white", marginBottom: 10}}>Expect bugs</div>
        <Button style={{marginBottom: 10}} variant="contained" onClick={() => playInstrument("kick")}>Kick (A)</Button>
        <Button style={{marginBottom: 10}} variant="contained" onClick={() => playInstrument("snare")}>Snare (S)</Button>
        <Button style={{marginBottom: 10}} variant="contained" onClick={() => playInstrument("hihat")}>Hihat (D)</Button>

        <div style={{color: "white", marginBottom: 10}}>Inferred BPM: {60 / inferredSecondsToNextBeat}</div>

        <Button style={{marginBottom: 10}} variant="text"><FiberManualRecordIcon onClick={record} /> <StopIcon onClick={stopRecording} /></Button>
        <Button style={{marginBottom: 10}} variant="text" onClick={() => exportToAbleton()}>Export to Ableton</Button>
      </header>
    </div>
  );
}

let rec: any = null;
let audioChunks: any[] = [];

function exportToAbleton() {
  navigator.mediaDevices.enumerateDevices().then(gotDevices);
}

function record() {
  if (rec === null) {
    console.warn("Recorder device not loaded");
    return;
  }
  audioChunks = [];
  rec.start();
}

function stopRecording() {
  if (rec === null) {
    console.warn("Recorder device not loaded");
    return;
  }
  rec.stop();
}

function gotDevices(deviceInfos: any) {
  // FIXME: Find more resilient way to find Soundflower device
  let soundFlowerInfo = _.find(deviceInfos, {kind: "audioinput", label: "Soundflower (64ch)"});
  console.log(soundFlowerInfo);

  navigator.mediaDevices.getUserMedia({audio: {deviceId: soundFlowerInfo.deviceId}})
    .then((stream) => {
      console.log("Recording the stream");
      rec = new MediaRecorder(stream);

      rec.ondataavailable = (e: any) => {
        audioChunks.push(e.data);
        if (rec.state == "inactive") {
          let blob = new Blob(audioChunks, {
            type: 'audio/x-mpeg-3'
          });
          console.log(URL.createObjectURL(blob));
        }
      }
    })
    .catch((err) => {
      /* handle the error */
      console.log(err);
    });
  playInstrument("hihat");
}

