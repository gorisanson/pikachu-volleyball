"use strict";

//import * as PIXI from "./pixi/pixi.min.js"; // not working..
import { PikachuVolleyball } from "./pikavolley.js";

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
const loader = new PIXI.Loader();
const ticker = new PIXI.Ticker();

ticker.add(() => {
  renderer.render(stage);
}, PIXI.UPDATE_PRIORITY.LOW);
ticker.start();

document.body.appendChild(renderer.view);
loader.add("assets/sprite_sheet.json").load(setup);

function setup() {
  const textures = loader.resources["assets/sprite_sheet.json"].textures;
  const pikaVolley = new PikachuVolleyball(stage, textures);

  // adjust audio setting
  const audio = pikaVolley.audio;
  audio.bgm.loop = true;
  for (const p in audio) {
    audio[p].volume = 0.3;
  }

  pikaVolley.state = pikaVolley.menu;
  renderer.view.addEventListener("click", () => start(pikaVolley), {
    once: true
  });
}

function start(pikaVolley) {
  ticker.maxFPS = pikaVolley.normalFPS;
  ticker.add(delta => pikaVolley.gameLoop(delta));
}
