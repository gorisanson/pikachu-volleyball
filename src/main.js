'use strict';
import * as PIXI from 'pixi.js';
import 'pixi-sound';
import { PikachuVolleyball } from './pikavolley.js';
import { RESOURCE_PATH } from './resource_path.js';

const settings = PIXI.settings;
settings.RESOLUTION = window.devicePixelRatio;
settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

const renderer = PIXI.autoDetectRenderer({
  width: 432,
  height: 304,
  antialias: false,
  backgroundColor: 0x000000,
  transparent: false
});
const stage = new PIXI.Container();
const ticker = new PIXI.Ticker();
const loader = new PIXI.Loader();

renderer.view.setAttribute('id', 'game-canvas');
document.getElementById('grid-container0').appendChild(renderer.view);

ticker.add(() => {
  renderer.render(stage);
}, PIXI.UPDATE_PRIORITY.LOW);
ticker.start();

loader.add(RESOURCE_PATH.SPRITE_SHEET);
for (const prop in RESOURCE_PATH.SOUNDS) {
  loader.add(RESOURCE_PATH.SOUNDS[prop]);
}
loader.load(setup);

function setup() {
  const pikaVolley = new PikachuVolleyball(stage, loader.resources);
  const pauseBtn = document.getElementById('pause-btn');
  const restartBtn = document.getElementById('restart-btn');
  const bgmOnBtn = document.getElementById('bgm-on-btn');
  const bgmOffBtn = document.getElementById('bgm-off-btn');
  const stereoBtn = document.getElementById('stereo-btn');
  const monoBtn = document.getElementById('mono-btn');
  const sfxOffBtn = document.getElementById('sfx-off-btn');
  const slowSpeedBtn = document.getElementById('slow-speed-btn');
  const mediumSpeedBtn = document.getElementById('medium-speed-btn');
  const fastSpeedBtn = document.getElementById('fast-speed-btn');
  const winningScore5Btn = document.getElementById('winning-score-5-btn');
  const winningScore10Btn = document.getElementById('winning-score-10-btn');
  const winningScore15Btn = document.getElementById('winning-score-15-btn');
  const practiceModeOnBtn = document.getElementById('practice-mode-on-btn');
  const practiceModeOffBtn = document.getElementById('practice-mode-off-btn');

  pauseBtn.addEventListener('click', () => {
    pikaVolley.paused = !pikaVolley.paused;
    if (pikaVolley.paused === true) {
      pauseBtn.classList.add('selected');
    } else {
      pauseBtn.classList.remove('selected');
    }
  });

  restartBtn.addEventListener('click', () => {
    pikaVolley.restart();
  });

  bgmOnBtn.addEventListener('click', () => {
    bgmOffBtn.classList.remove('selected');
    bgmOnBtn.classList.add('selected');
    pikaVolley.audio.turnBGMVolume(true);
  });

  bgmOffBtn.addEventListener('click', () => {
    bgmOnBtn.classList.remove('selected');
    bgmOffBtn.classList.add('selected');
    pikaVolley.audio.turnBGMVolume(false);
  });

  // TODO: stereo sound
  stereoBtn.addEventListener('click', () => {
    monoBtn.classList.remove('selected');
    sfxOffBtn.classList.remove('selected');
    stereoBtn.classList.add('selected');
    pikaVolley.audio.turnSFXVolume(true);
  });

  monoBtn.addEventListener('click', () => {
    sfxOffBtn.classList.remove('selected');
    stereoBtn.classList.remove('selected');
    monoBtn.classList.add('selected');
    pikaVolley.audio.turnSFXVolume(true);
  });

  sfxOffBtn.addEventListener('click', () => {
    stereoBtn.classList.remove('selected');
    monoBtn.classList.remove('selected');
    sfxOffBtn.classList.add('selected');
    pikaVolley.audio.turnSFXVolume(false);
  });

  fastSpeedBtn.addEventListener('click', () => {
    mediumSpeedBtn.classList.remove('selected');
    slowSpeedBtn.classList.remove('selected');
    fastSpeedBtn.classList.add('selected');

    pikaVolley.normalFPS = 30;
    ticker.maxFPS = pikaVolley.normalFPS;
  });

  mediumSpeedBtn.addEventListener('click', () => {
    slowSpeedBtn.classList.remove('selected');
    fastSpeedBtn.classList.remove('selected');
    mediumSpeedBtn.classList.add('selected');

    pikaVolley.normalFPS = 25;
    ticker.maxFPS = pikaVolley.normalFPS;
  });

  slowSpeedBtn.addEventListener('click', () => {
    fastSpeedBtn.classList.remove('selected');
    mediumSpeedBtn.classList.remove('selected');
    slowSpeedBtn.classList.add('selected');

    pikaVolley.normalFPS = 20;
    ticker.maxFPS = pikaVolley.normalFPS;
  });

  // TODO: if current score is already over....
  winningScore5Btn.addEventListener('click', () => {
    winningScore10Btn.classList.remove('selected');
    winningScore15Btn.classList.remove('selected');
    winningScore5Btn.classList.add('selected');
    pikaVolley.winningScore = 5;
  });

  winningScore10Btn.addEventListener('click', () => {
    winningScore15Btn.classList.remove('selected');
    winningScore5Btn.classList.remove('selected');
    winningScore10Btn.classList.add('selected');
    pikaVolley.winningScore = 10;
  });

  winningScore15Btn.addEventListener('click', () => {
    winningScore5Btn.classList.remove('selected');
    winningScore10Btn.classList.remove('selected');
    winningScore15Btn.classList.add('selected');
    pikaVolley.winningScore = 15;
  });

  practiceModeOnBtn.addEventListener('click', () => {
    practiceModeOffBtn.classList.remove('selected');
    practiceModeOnBtn.classList.add('selected');
    pikaVolley.isPracticeMode = true;
  });

  practiceModeOffBtn.addEventListener('click', () => {
    practiceModeOnBtn.classList.remove('selected');
    practiceModeOffBtn.classList.add('selected');
    pikaVolley.isPracticeMode = false;
  });

  start(pikaVolley);
}

function start(pikaVolley) {
  ticker.maxFPS = pikaVolley.normalFPS;
  ticker.add(delta => pikaVolley.gameLoop(delta));
}
