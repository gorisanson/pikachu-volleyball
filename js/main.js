"use strict";

//import * as PIXI from "./pixi/pixi.min.js"; // not working..
import { PikachuVolleyball } from "./pikavolley.js";

PIXI.settings.RESOLUTION = window.devicePixelRatio;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.ROUND_PIXELS = true;

// Aliases
const Application = PIXI.Application;
const Loader = PIXI.Loader;

const app = new Application({
  width: 432,
  height: 304,
  autoDensity: true,
  antialias: false,
  backgroundColor: 0x000000,
  transparent: false
});
document.body.appendChild(app.view);
Loader.shared.add("assets/sprite_sheet.json").load(setup);

function setup() {
  const textures = Loader.shared.resources["assets/sprite_sheet.json"].textures;
  const pikaVolley = new PikachuVolleyball(app, textures);

  // adjust audio setting
  const audio = pikaVolley.audio;
  audio.bgm.loop = true;
  for (const p in audio) {
    audio[p].volume = 0.3;
  }

  pikaVolley.state = pikaVolley.menu;
  app.view.addEventListener("click", () => start(pikaVolley), { once: true });
}

function start(pikaVolley) {
  app.ticker.maxFPS = pikaVolley.normalFPS;
  app.ticker.add(delta => pikaVolley.gameLoop(delta));
}
