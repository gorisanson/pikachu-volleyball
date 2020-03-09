"use strict";
import * as PIXI from "pixi.js"; // not working..
import "pixi-sound";
import { PikachuVolleyball } from "./pikavolley.js";
import { SPRITE_SHEET_PATH } from "./pika_view.js";
import { PATH as AUDIO_PATH } from "./pika_audio.js";

PIXI.settings.RESOLUTION = window.devicePixelRatio;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.ROUND_PIXELS = true;

const renderer = new PIXI.autoDetectRenderer({
  width: 432,
  height: 304,
  autoDensity: true,
  antialias: false,
  backgroundColor: 0x000000,
  transparent: false
});
const stage = new PIXI.Container();
const ticker = new PIXI.Ticker();
const loader = new PIXI.Loader();

document.body.appendChild(renderer.view);

ticker.add(() => {
  renderer.render(stage);
}, PIXI.UPDATE_PRIORITY.LOW);
ticker.start();

loader.add(SPRITE_SHEET_PATH);
for (const prop in AUDIO_PATH) {
  loader.add(AUDIO_PATH[prop]);
}
loader.load(setup);

function setup() {
  const pikaVolley = new PikachuVolleyball(stage, loader.resources);

  // adjust audio setting
  const audio = pikaVolley.audio;
  audio.bgm.loop = true;
  for (const p in audio) {
    audio[p].volume = 0.3;
  }
  // renderer.view.addEventListener("click", () => start(pikaVolley), {
  //   once: true
  // });
  start(pikaVolley);
}

function start(pikaVolley) {
  ticker.maxFPS = pikaVolley.normalFPS;
  ticker.add(delta => pikaVolley.gameLoop(delta));
}
