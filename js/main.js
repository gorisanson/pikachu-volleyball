"use strict";

//import * as PIXI from "./pixi/pixi.min.js"; // not working..
import { PikaKeyboard } from "./pika_keyboard.js";
import { PikaPhysics } from "./pika.js";
import { PikaAudio } from "./pika_audio.js";
import { Cloud, Wave, cloudAndWaveEngine } from "./pika_cloud_and_wave.js";
import { PikaSprites } from "./pika_sprites.js";
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
  backgroundColor: 0x00ff00,
  transparent: false
});
document.body.appendChild(app.view);
Loader.shared.add("assets/sprite_sheet.json").load(setup);

function setup() {
  const textures = Loader.shared.resources["assets/sprite_sheet.json"].textures;
  const sprites = new PikaSprites(textures);

  // TODO: careful with the order of addChild, the later, the fronter?
  app.stage.addChild(sprites.bgContainer);
  app.stage.addChild(sprites.cloudContainer);
  app.stage.addChild(sprites.waveContainer);
  app.stage.addChild(sprites.shadows.forPlayer1);
  app.stage.addChild(sprites.shadows.forPlayer2);
  app.stage.addChild(sprites.shadows.forBall);
  app.stage.addChild(sprites.player1);
  app.stage.addChild(sprites.player2);
  app.stage.addChild(sprites.ballTrail);
  app.stage.addChild(sprites.ballHyper);
  app.stage.addChild(sprites.ball);
  app.stage.addChild(sprites.punch);
  app.stage.addChild(sprites.scoreBoards[0]);
  app.stage.addChild(sprites.scoreBoards[1]);
  app.stage.addChild(sprites.messages.gameStart);
  app.stage.addChild(sprites.messages.ready);
  app.stage.addChild(sprites.messages.gameEnd);
  app.stage.addChild(sprites.messages.fight);
  app.stage.addChild(sprites.black);

  sprites.bgContainer.x = 0;
  sprites.bgContainer.y = 0;
  sprites.cloudContainer.x = 0;
  sprites.cloudContainer.y = 0;
  sprites.waveContainer.x = 0;
  sprites.waveContainer.y = 0;

  sprites.messages.ready.x = 176;
  sprites.messages.ready.y = 38;
  sprites.scoreBoards[0].x = 14; // score board is 14 pixel distant from boundary
  sprites.scoreBoards[0].y = 10;
  sprites.scoreBoards[1].x = 432 - 32 - 32 - 14; // 32 pixel is for number (32x32px) width; one score board has tow numbers
  sprites.scoreBoards[1].y = 10;
  sprites.black.x = 0;
  sprites.black.y = 0;
  sprites.black.alph = 1;
  sprites.black.visible = true;

  sprites.shadows.forPlayer1.y = 272;
  sprites.shadows.forPlayer2.y = 272;
  sprites.shadows.forBall.y = 272;

  sprites.ballHyper.visible = false;
  sprites.ballTrail.visible = false;
  sprites.punch.visible = false;

  for (const prop in sprites.messages) {
    sprites.messages[prop].visible = false;
  }

  const pikaVolley = new PikachuVolleyball(sprites);

  // adjust audio setting
  const audio = pikaVolley.audio;
  audio.bgm.loop = true;
  for (const p in audio) {
    audio[p].volume = 0.3;
  }

  pikaVolley.state = pikaVolley.startOfNewGame;
  app.view.addEventListener("click", () => start(pikaVolley), { once: true });
}

function start(pikaVolley) {
  app.ticker.maxFPS = pikaVolley.normalFPS;
  app.ticker.add(delta => pikaVolley.gameLoop(delta));
}
