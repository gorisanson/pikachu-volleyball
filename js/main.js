"use strict";

//import * as PIXI from "./pixi/pixi.min.js"; // not working..
import { PikaKeyboard } from "./pika_keyboard.js";
import { PikaPhysics } from "./pika.js";
import { PikaAudio } from "./pika_audio.js";
import { Cloud, Wave, cloudAndWaveEngine } from "./pika_cloud_and_wave.js";
import { PikaSprites } from "./pika_sprites.js";

PIXI.settings.RESOLUTION = window.devicePixelRatio;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.ROUND_PIXELS = true;

// Aliases
const Application = PIXI.Application;
const Loader = PIXI.Loader;

const NUM_OF_CLOUDS = 10;

// global variables are in "pikaVolley"
/*
const pikaVolley = {
  loader: Loader.shared,
  textures: null,
  app: new Application({
    width: 432,
    height: 304,
    autoDensity: true,
    antialias: false,
    backgroundColor: 0x00ff00,
    transparent: false
  }),
  state: null,
  nextState: null,
  normalFPS: 25,
  slowMotionFPS: 5,
  slowMotionFramesLeft: 0,
  slowMotionNumOfSkippedFrames: 0,
  SLOW_MOTION_FRAMES_NUM: 6,
  cloudContainer: null,
  waveContainer: null,
  isPlayer2Serve: false,
  roundEnded: false,
  startOfNewGameFrameNum: 71,
  elapsedStartOfNewGameFrame: 0,
  afterEndOfRoundFrameNum: 5,
  elapsedAfterEndOfRoundFrame: 0,
  beForeStartOfNextRoundFrameNum: 30,
  elapsedBeforeStartOfNextRoundFrame: 0,
  elapsedGameEndFrame: 0,
  // TODO: is it better to include this to player porperty?
  scores: [0, 0], // scores[0] for player1, scores[1] for player2
  goalScore: 15,
  gameEnded: false,
  sprites: {
    shadows: {
      forPlayer1: null,
      forPlayer2: null,
      forBall: null
    },
    player1: null,
    player2: null,
    ball: null,
    ballHyper: null,
    ballTrail: null,
    punch: null,
    scoreBoards: [null, null], // scoreBoards[0] for player1, scoreBoards[1] for player2
    messages: {
      fight: null,
      gameStart: null,
      ready: null,
      gameEnd: null
    },
    black: null // for fade out effect
  },
  audio: {
    bgm: new Audio("assets/bgm.mp3"),
    pipikachu: new Audio("assets/WAVE140_1.wav"),
    pika: new Audio("assets/WAVE141_1.wav"),
    chu: new Audio("assets/WAVE142_1.wav"),
    pi: new Audio("assets/WAVE143_1.wav"),
    pikachu: new Audio("assets/WAVE144_1.wav"),
    powerHit: new Audio("assets/WAVE145_1.wav"),
    ballTouchesGround: new Audio("assets/WAVE146_1.wav")
  },
  physics: {
    player1: new Player(false, true),
    player2: new Player(true, false),
    ball: new Ball(),
    sound: new Sound(),
    clouds: (() => {
      const clouds = [];
      for (let i = 0; i < NUM_OF_CLOUDS; i++) {
        clouds.push(new Cloud());
      }
      return clouds;
    })(),
    wave: new Wave()
  },
  keyboardArray: [
    new PikaKeyboard("d", "g", "r", "f", "z"), // for player1
    new PikaKeyboard("ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter") // for player2
  ]
};
*/

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

class PikachuVolleyball {
  constructor(pixiApplication, pikaSprites) {
    this.app = pixiApplication;
    this.sprites = pikaSprites;
    this.audio = new PikaAudio();
    this.physics = new PikaPhysics(true, false);
    this.keyboardArray = [
      new PikaKeyboard("d", "g", "r", "f", "z"), // for player1
      new PikaKeyboard(
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Enter"
      ) // for player2
    ];
    this.clouds = (() => {
      const clouds = [];
      for (let i = 0; i < NUM_OF_CLOUDS; i++) {
        clouds.push(new Cloud());
      }
      return clouds;
    })();
    this.wave = new Wave();
    this.state = null;
    this.nextState = null;
    this.normalFPS = 25;
    this.slowMotionFPS = 5;
    this.slowMotionFramesLeft = 0;
    this.slowMotionNumOfSkippedFrames = 0;
    this.SLOW_MOTION_FRAMES_NUM = 6;
    this.cloudContainer = null;
    this.waveContainer = null;
    this.isPlayer2Serve = false;
    this.roundEnded = false;
    this.startOfNewGameFrameNum = 71;
    this.elapsedStartOfNewGameFrame = 0;
    this.afterEndOfRoundFrameNum = 5;
    this.elapsedAfterEndOfRoundFrame = 0;
    this.beForeStartOfNextRoundFrameNum = 30;
    this.elapsedBeforeStartOfNextRoundFrame = 0;
    this.elapsedGameEndFrame = 0;
    // TODO: is it better to include this to player porperty?
    this.scores = [0, 0]; // scores[0] for player1, scores[1] for player2
    this.goalScore = 15;
    this.gameEnded = false;
  }
}

let pikaVolley;
function setup() {
  const textures = Loader.shared.resources["assets/sprite_sheet.json"].textures;
  const pikaSprites = new PikaSprites(textures);

  pikaVolley = new PikachuVolleyball(app, pikaSprites);

  // TODO: careful with the order of addChild, the later, the fronter?
  const sprites = pikaVolley.sprites;
  pikaVolley.app.stage.addChild(sprites.bgContainer);
  pikaVolley.app.stage.addChild(sprites.cloudContainer);
  pikaVolley.app.stage.addChild(sprites.waveContainer);
  pikaVolley.app.stage.addChild(sprites.shadows.forPlayer1);
  pikaVolley.app.stage.addChild(sprites.shadows.forPlayer2);
  pikaVolley.app.stage.addChild(sprites.shadows.forBall);
  pikaVolley.app.stage.addChild(sprites.player1);
  pikaVolley.app.stage.addChild(sprites.player2);
  pikaVolley.app.stage.addChild(sprites.ballTrail);
  pikaVolley.app.stage.addChild(sprites.ballHyper);
  pikaVolley.app.stage.addChild(sprites.ball);
  pikaVolley.app.stage.addChild(sprites.punch);
  pikaVolley.app.stage.addChild(sprites.scoreBoards[0]);
  pikaVolley.app.stage.addChild(sprites.scoreBoards[1]);
  pikaVolley.app.stage.addChild(sprites.messages.gameStart);
  pikaVolley.app.stage.addChild(sprites.messages.ready);
  pikaVolley.app.stage.addChild(sprites.messages.gameEnd);
  pikaVolley.app.stage.addChild(sprites.messages.fight);
  pikaVolley.app.stage.addChild(sprites.black);

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

  // adjust audio setting
  const audio = pikaVolley.audio;
  audio.bgm.loop = true;
  for (const p in audio) {
    audio[p].volume = 0.3;
  }

  pikaVolley.state = startOfNewGame;
  pikaVolley.app.view.addEventListener("click", gameStart, { once: true });
}

function gameStart() {
  pikaVolley.app.ticker.maxFPS = pikaVolley.normalFPS;
  pikaVolley.app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
  if (pikaVolley.slowMotionFramesLeft > 0) {
    pikaVolley.slowMotionNumOfSkippedFrames++;
    if (
      pikaVolley.slowMotionNumOfSkippedFrames %
        Math.round(pikaVolley.normalFPS / pikaVolley.slowMotionFPS) ===
      0
    ) {
      pikaVolley.slowMotionFramesLeft--;
      pikaVolley.slowMotionNumOfSkippedFrames = 0;
      pikaVolley.state(delta);
      moveCloudsAndWaves(delta);
    }
  } else {
    pikaVolley.state(delta);
    moveCloudsAndWaves(delta);
  }
}

// this funtion corresponds to FUN_00404770 in origianl machine (assembly) code
function moveCloudsAndWaves(delta) {
  const clouds = pikaVolley.clouds;
  const wave = pikaVolley.wave;

  cloudAndWaveEngine(clouds, wave);

  for (let i = 0; i < NUM_OF_CLOUDS; i++) {
    const cloud = clouds[i];
    const cloudSprite = pikaVolley.sprites.cloudContainer.getChildAt(i);
    cloudSprite.x = cloud.spriteTopLeftPointX;
    cloudSprite.y = cloud.spriteTopLeftPointY;
    cloudSprite.width = cloud.spriteWidth;
    cloudSprite.height = cloud.spriteHeight;
  }

  for (let i = 0; i < 432 / 16; i++) {
    const waveSprite = pikaVolley.sprites.waveContainer.getChildAt(i);
    waveSprite.y = wave.yCoords[i];
  }
}

// refered FUN_00403f20
function startOfNewGame(delta) {
  const gameStartMessage = pikaVolley.sprites.messages.gameStart;
  const black = pikaVolley.sprites.black;
  if (pikaVolley.elapsedStartOfNewGameFrame === 0) {
    gameStartMessage.visible = true;
    black.visible = true;
    black.alpha = 1;

    pikaVolley.gameEnded = false;
    pikaVolley.roundEnded = false;
    pikaVolley.physics.player1.gameEnded = false;
    pikaVolley.physics.player1.isWinner = false;
    pikaVolley.physics.player2.gameEnded = false;
    pikaVolley.physics.player2.isWinner = false;
    pikaVolley.isPlayer2Serve = false;

    pikaVolley.scores[0] = 0;
    pikaVolley.scores[1] = 0;
    showScoreToScoreBoard();
    drawGraphicForRoundStart();
    pikaVolley.audio.bgm.play();
  }

  const w = 96; // game start message texture width
  const h = 24; // game start message texture height
  const halfWidth = Math.floor(
    (w * pikaVolley.elapsedStartOfNewGameFrame) / 50
  );
  const halfHeight = Math.floor(
    (h * pikaVolley.elapsedStartOfNewGameFrame) / 50
  );
  gameStartMessage.x = 216 - halfWidth;
  gameStartMessage.y = 50 + 2 * halfHeight;
  gameStartMessage.width = 2 * halfWidth;
  gameStartMessage.height = 2 * halfHeight;

  black.alpha = Math.max(0, black.alpha - 1 / 17);
  pikaVolley.elapsedStartOfNewGameFrame++;

  if (
    pikaVolley.elapsedStartOfNewGameFrame >= pikaVolley.startOfNewGameFrameNum
  ) {
    pikaVolley.elapsedStartOfNewGameFrame = 0;
    gameStartMessage.visible = false;
    black.visible = false;
    pikaVolley.state = round;
  }
}

function afterEndOfRound(delta) {
  const black = pikaVolley.sprites.black;
  black.alpha = Math.min(1, black.alpha + 1 / 16); // steadily increase alpha to 1 (fade out)
  pikaVolley.elapsedAfterEndOfRoundFrame++;
  if (
    pikaVolley.elapsedAfterEndOfRoundFrame >= pikaVolley.afterEndOfRoundFrameNum
  ) {
    pikaVolley.elapsedAfterEndOfRoundFrame = 0;
    pikaVolley.state = beforeStartOfNextRound;
  }
}

function beforeStartOfNextRound(delta) {
  const readyMessage = pikaVolley.sprites.messages.ready;
  const black = pikaVolley.sprites.black;
  if (pikaVolley.elapsedBeforeStartOfNextRoundFrame === 0) {
    readyMessage.visible = false;
    black.visible = true;
    black.alpha = 1;
    drawGraphicForRoundStart();
  }

  pikaVolley.elapsedBeforeStartOfNextRoundFrame++;
  black.alpha = Math.max(0, black.alpha - 1 / 16);

  if (pikaVolley.elapsedBeforeStartOfNextRoundFrame % 5 === 0) {
    readyMessage.visible = !readyMessage.visible;
  }

  if (
    pikaVolley.elapsedBeforeStartOfNextRoundFrame >=
    pikaVolley.beForeStartOfNextRoundFrameNum
  ) {
    readyMessage.visible = false;
    black.alpha = 0;
    black.visible = false;
    pikaVolley.elapsedBeforeStartOfNextRoundFrame = 0;
    pikaVolley.roundEnded = false;
    pikaVolley.state = round;
  }
}

// refered FUN_00404070
function gameEnd(delta) {
  const gameEndMessage = pikaVolley.sprites.messages.gameEnd;
  const w = 96; // game end message texture width;
  const h = 24; // game end message texture height;

  if (pikaVolley.elapsedGameEndFrame === 0) {
    gameEndMessage.visible = true;
  }
  if (pikaVolley.elapsedGameEndFrame < 50) {
    const halfWidthIncrement =
      2 * Math.floor(((50 - pikaVolley.elapsedGameEndFrame) * w) / 50);
    const halfHeightIncrement =
      2 * Math.floor(((50 - pikaVolley.elapsedGameEndFrame) * h) / 50);

    gameEndMessage.x = 216 - w / 2 - halfWidthIncrement;
    gameEndMessage.y = 50 - halfHeightIncrement;
    gameEndMessage.width = w + 2 * halfWidthIncrement;
    gameEndMessage.height = h + 2 * halfHeightIncrement;
  } else {
    gameEndMessage.x = 216 - w / 2;
    gameEndMessage.y = 50;
    gameEndMessage.width = w;
    gameEndMessage.height = h;
  }
  pikaVolley.elapsedGameEndFrame++;
  if (pikaVolley.elapsedGameEndFrame > 210) {
    pikaVolley.elapsedGameEndFrame = 0;
    gameEndMessage.visible = false;
    pikaVolley.state = startOfNewGame;
  }
}

//pikaVolley.fightMessageSizeInfo = 0;
//pikaVolley.fightMessageEnlarged = false;
// FUN_00405d50
function moveFightMessage(delta) {
  const sizeArray = [20, 22, 25, 27, 30, 27, 25, 22, 20];
  const fightMessageWidth = 160;
  const fightMessageHeight = 160;
  const fightMessage = pikaVolley.sprites.messages.fight;
  if (pikaVolley.fightMessageEnlarged === false) {
    if (pikaVolley.fightMessageSizeInfo === 0) {
      pikaVolley.sprites.black.visible = false;
      fightMessage.visible = true;
    }
    pikaVolley.fightMessageSizeInfo += 1;

    const halfWidth = Math.floor(
      Math.floor((pikaVolley.fightMessageSizeInfo * fightMessageWidth) / 30) / 2
    );
    const halfHeight = Math.floor(
      Math.floor((pikaVolley.fightMessageSizeInfo * fightMessageHeight) / 30) /
        2
    );
    fightMessage.width = halfWidth * 2; // width
    fightMessage.height = halfHeight * 2; // height
    fightMessage.x = 100 - halfWidth; // x coor
    fightMessage.y = 70 - halfHeight; // y coord

    //// iVar3 = code ??
    // FUN_00409690
    if (pikaVolley.fightMessageSizeInfo > 29) {
      pikaVolley.fightMessageEnlarged = true;
      // FUN_00408ee0
      //param_1[0x1d] = 200;
      return;
    }
  } else {
    pikaVolley.fightMessageSizeInfo = (pikaVolley.fightMessageSizeInfo + 1) % 9;
    // code ...
    const halfWidth = Math.floor(
      Math.floor(
        (sizeArray[pikaVolley.fightMessageSizeInfo] * fightMessageWidth) / 30
      ) / 2
    );
    const halfHeight = Math.floor(
      Math.floor(
        (sizeArray[pikaVolley.fightMessageSizeInfo] * fightMessageHeight) / 30
      ) / 2
    );
    fightMessage.width = halfWidth * 2; // width
    fightMessage.height = halfHeight * 2; // heigth
    fightMessage.y = 70 - halfHeight; // y coord
    fightMessage.x = 100 - halfWidth; // x coord
    //iVar3 = code ??
    // FUN_00409690
  }
}

function round(delta) {
  // catch keyboard input and freeze it
  pikaVolley.keyboardArray[0].updateProperties();
  pikaVolley.keyboardArray[1].updateProperties();

  const isBallTouchingGround = pikaVolley.physics.runEngineForNextFrame(
    pikaVolley.keyboardArray
  );

  playSoundEffect();
  drawGraphicForPlayerAndBall();

  // TODO: move these to physics engine
  const ball = pikaVolley.physics.ball;
  ball.previousPreviousX = ball.previousX;
  ball.previousPreviousY = ball.previousY;
  ball.previousX = ball.x;
  ball.previousY = ball.y;

  if (pikaVolley.gameEnded === true) {
    gameEnd();
    return;
  }

  if (
    isBallTouchingGround &&
    pikaVolley.roundEnded === false &&
    pikaVolley.gameEnded === false
  ) {
    // TODO: is it better for move this to physics function?
    // by including isPlayer2Serve property into ball, score to player
    if (ball.punchEffectX < 216) {
      pikaVolley.isPlayer2Serve = true;
      pikaVolley.scores[1] += 1;
      if (pikaVolley.scores[1] >= pikaVolley.goalScore) {
        pikaVolley.gameEnded = true;
        pikaVolley.physics.player1.isWinner = false;
        pikaVolley.physics.player2.isWinner = true;
        pikaVolley.physics.player1.gameEnded = true;
        pikaVolley.physics.player2.gameEnded = true;
      }
    } else {
      pikaVolley.isPlayer2Serve = false;
      pikaVolley.scores[0] += 1;
      if (pikaVolley.scores[0] >= pikaVolley.goalScore) {
        pikaVolley.gameEnded = true;
        pikaVolley.physics.player1.isWinner = true;
        pikaVolley.physics.player2.isWinner = false;
        pikaVolley.physics.player1.gameEnded = true;
        pikaVolley.physics.player2.gameEnded = true;
      }
    }
    showScoreToScoreBoard();
    if (pikaVolley.roundEnded === false && pikaVolley.gameEnded === false) {
      pikaVolley.slowMotionFramesLeft = pikaVolley.SLOW_MOTION_FRAMES_NUM;
    }
    pikaVolley.roundEnded = true;
  }

  if (pikaVolley.roundEnded === true && pikaVolley.gameEnded === false) {
    // if this is the last frame of this round, begin fade out
    if (pikaVolley.slowMotionFramesLeft === 0) {
      const black = pikaVolley.sprites.black;
      black.visible = true;
      black.alpha += 1 / 16;

      pikaVolley.state = afterEndOfRound;
    }
  }
}

function drawGraphicForRoundStart(delta) {
  pikaVolley.physics.player1.initializeForNewRound();
  pikaVolley.physics.player2.initializeForNewRound();
  pikaVolley.physics.ball.initializeForNewRound(pikaVolley.isPlayer2Serve);
  drawGraphicForPlayerAndBall();
}

function playSoundEffect() {
  const sound = pikaVolley.physics.sound;
  const audio = pikaVolley.audio;
  if (sound.pipikachu === true) {
    audio.pipikachu.play();
    sound.pipikachu = false;
  }
  if (sound.pika === true) {
    audio.pika.play();
    sound.pika = false;
  }
  if (sound.chu === true) {
    audio.chu.play();
    sound.chu = false;
  }
  if (sound.powerHit === true) {
    audio.powerHit.play();
    sound.powerHit = false;
  }
  if (sound.ballTouchesGround === true) {
    audio.ballTouchesGround.play();
    sound.ballTouchesGround = false;
  }
}

function drawGraphicForPlayerAndBall() {
  const player1 = pikaVolley.physics.player1;
  const player2 = pikaVolley.physics.player2;
  const ball = pikaVolley.physics.ball;

  const sprites = pikaVolley.sprites;
  sprites.player1.x = player1.x;
  sprites.player1.y = player1.y;
  sprites.shadows.forPlayer1.x = player1.x;
  sprites.player2.x = player2.x;
  sprites.player2.y = player2.y;
  sprites.shadows.forPlayer2.x = player2.x;

  const frameNumber1 = getFrameNumberForPlayerAnimatedSprite(
    player1.state,
    player1.frameNumber
  );
  const frameNumber2 = getFrameNumberForPlayerAnimatedSprite(
    player2.state,
    player2.frameNumber
  );
  sprites.player1.gotoAndStop(frameNumber1);
  sprites.player2.gotoAndStop(frameNumber2);

  sprites.ball.x = ball.x;
  sprites.ball.y = ball.y;
  sprites.shadows.forBall.x = ball.x;
  sprites.ball.gotoAndStop(ball.rotation);

  if (ball.punchEffectRadius > 0) {
    ball.punchEffectRadius -= 2;
    sprites.punch.width = 2 * ball.punchEffectRadius;
    sprites.punch.height = 2 * ball.punchEffectRadius;
    sprites.punch.x = ball.punchEffectX;
    sprites.punch.y = ball.punchEffectY;
    sprites.punch.visible = true;
  } else {
    sprites.punch.visible = false;
  }

  if (ball.isPowerHit === true) {
    sprites.ballHyper.x = ball.previousX;
    sprites.ballHyper.y = ball.previousY;
    sprites.ballTrail.x = ball.previousPreviousX;
    sprites.ballTrail.y = ball.previousPreviousY;

    sprites.ballHyper.visible = true;
    sprites.ballTrail.visible = true;
  } else {
    sprites.ballHyper.visible = false;
    sprites.ballTrail.visible = false;
  }
}

function showScoreToScoreBoard() {
  for (let i = 0; i < 2; i++) {
    const scoreBoard = pikaVolley.sprites.scoreBoards[i];
    const score = pikaVolley.scores[i];
    const unitsAnimatedSprite = scoreBoard.getChildAt(0);
    const tensAnimatedSprite = scoreBoard.getChildAt(1);
    unitsAnimatedSprite.gotoAndStop(score % 10);
    tensAnimatedSprite.gotoAndStop(Math.floor(score / 10) % 10);
    if (score >= 10) {
      tensAnimatedSprite.visible = true;
    } else {
      tensAnimatedSprite.visible = false;
    }
  }
}

// number of frames for state 0, state 1 and state 2 is 5 for each.
// number of frames for state 3 is 2.
// number of frames for state 4 is 1.
// number of frames for state 5, state 6 is 5 for each.
function getFrameNumberForPlayerAnimatedSprite(state, frameNumber) {
  if (state < 4) {
    return 5 * state + frameNumber;
  } else if (state === 4) {
    return 17 + frameNumber;
  } else if (state > 4) {
    return 18 + 5 * (state - 5) + frameNumber;
  }
}
