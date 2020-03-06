import { PikaKeyboard } from "./pika_keyboard.js";
import { PikaPhysics } from "./pika_physics.js";
import { PikaAudio } from "./pika_audio.js";
import { Cloud, Wave, cloudAndWaveEngine } from "./pika_cloud_and_wave.js";

// TODO:::...
const NUM_OF_CLOUDS = 10;

export class PikachuVolleyball {
  // pixiApplication: PIXI.Application object
  // pikaSprites: PikaSprites object
  constructor(pikaSprites) {
    this.sprites = pikaSprites;
    this.audio = new PikaAudio();
    this.physics = new PikaPhysics(true, false);
    this.keyboardArray = [
      new PikaKeyboard("d", "g", "r", "f", "z"), // for player1
      new PikaKeyboard( // for player2
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Enter"
      )
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
    this.scores = [0, 0]; // scores[0] for player1, scores[1] for player2
    this.goalScore = 15;
    this.gameEnded = false;
  }

  gameLoop(delta) {
    if (this.slowMotionFramesLeft > 0) {
      this.slowMotionNumOfSkippedFrames++;
      if (
        this.slowMotionNumOfSkippedFrames %
          Math.round(this.normalFPS / this.slowMotionFPS) ===
        0
      ) {
        this.slowMotionFramesLeft--;
        this.slowMotionNumOfSkippedFrames = 0;
        this.state(delta);
        this.moveCloudsAndWaves(delta);
      }
    } else {
      this.state(delta);
      this.moveCloudsAndWaves(delta);
    }
  }

  // refered FUN_00403f20
  startOfNewGame(delta) {
    const gameStartMessage = this.sprites.messages.gameStart;
    const black = this.sprites.black;
    if (this.elapsedStartOfNewGameFrame === 0) {
      gameStartMessage.visible = true;
      black.visible = true;
      black.alpha = 1;

      this.gameEnded = false;
      this.roundEnded = false;
      this.physics.player1.gameEnded = false;
      this.physics.player1.isWinner = false;
      this.physics.player2.gameEnded = false;
      this.physics.player2.isWinner = false;
      this.isPlayer2Serve = false;

      this.scores[0] = 0;
      this.scores[1] = 0;
      this.showScoreToScoreBoard();
      this.drawGraphicForRoundStart();
      this.audio.bgm.play();
    }

    const w = 96; // game start message texture width
    const h = 24; // game start message texture height
    const halfWidth = Math.floor((w * this.elapsedStartOfNewGameFrame) / 50);
    const halfHeight = Math.floor((h * this.elapsedStartOfNewGameFrame) / 50);
    gameStartMessage.x = 216 - halfWidth;
    gameStartMessage.y = 50 + 2 * halfHeight;
    gameStartMessage.width = 2 * halfWidth;
    gameStartMessage.height = 2 * halfHeight;

    black.alpha = Math.max(0, black.alpha - 1 / 17);
    this.elapsedStartOfNewGameFrame++;

    if (this.elapsedStartOfNewGameFrame >= this.startOfNewGameFrameNum) {
      this.elapsedStartOfNewGameFrame = 0;
      gameStartMessage.visible = false;
      black.visible = false;
      this.state = this.round;
    }
  }

  round(delta) {
    // catch keyboard input and freeze it
    this.keyboardArray[0].updateProperties();
    this.keyboardArray[1].updateProperties();

    const isBallTouchingGround = this.physics.runEngineForNextFrame(
      this.keyboardArray
    );

    this.playSoundEffect();
    this.drawGraphicForPlayerAndBall();

    // TODO: move these to physics engine
    const ball = this.physics.ball;
    ball.previousPreviousX = ball.previousX;
    ball.previousPreviousY = ball.previousY;
    ball.previousX = ball.x;
    ball.previousY = ball.y;

    if (this.gameEnded === true) {
      gameEnd();
      return;
    }

    if (
      isBallTouchingGround &&
      this.roundEnded === false &&
      this.gameEnded === false
    ) {
      // TODO: is it better for move this to physics function?
      // by including isPlayer2Serve property into ball, score to player
      if (ball.punchEffectX < 216) {
        this.isPlayer2Serve = true;
        this.scores[1] += 1;
        if (this.scores[1] >= this.goalScore) {
          this.gameEnded = true;
          this.physics.player1.isWinner = false;
          this.physics.player2.isWinner = true;
          this.physics.player1.gameEnded = true;
          this.physics.player2.gameEnded = true;
        }
      } else {
        this.isPlayer2Serve = false;
        this.scores[0] += 1;
        if (this.scores[0] >= this.goalScore) {
          this.gameEnded = true;
          this.physics.player1.isWinner = true;
          this.physics.player2.isWinner = false;
          this.physics.player1.gameEnded = true;
          this.physics.player2.gameEnded = true;
        }
      }
      this.showScoreToScoreBoard();
      if (this.roundEnded === false && this.gameEnded === false) {
        this.slowMotionFramesLeft = this.SLOW_MOTION_FRAMES_NUM;
      }
      this.roundEnded = true;
    }

    if (this.roundEnded === true && this.gameEnded === false) {
      // if this is the last frame of this round, begin fade out
      if (this.slowMotionFramesLeft === 0) {
        const black = this.sprites.black;
        black.visible = true;
        black.alpha += 1 / 16;

        this.state = this.afterEndOfRound;
      }
    }
  }

  afterEndOfRound(delta) {
    const black = this.sprites.black;
    black.alpha = Math.min(1, black.alpha + 1 / 16); // steadily increase alpha to 1 (fade out)
    this.elapsedAfterEndOfRoundFrame++;
    if (this.elapsedAfterEndOfRoundFrame >= this.afterEndOfRoundFrameNum) {
      this.elapsedAfterEndOfRoundFrame = 0;
      this.state = this.beforeStartOfNextRound;
    }
  }

  beforeStartOfNextRound(delta) {
    const readyMessage = this.sprites.messages.ready;
    const black = this.sprites.black;
    if (this.elapsedBeforeStartOfNextRoundFrame === 0) {
      readyMessage.visible = false;
      black.visible = true;
      black.alpha = 1;
      this.drawGraphicForRoundStart();
    }

    this.elapsedBeforeStartOfNextRoundFrame++;
    black.alpha = Math.max(0, black.alpha - 1 / 16);

    if (this.elapsedBeforeStartOfNextRoundFrame % 5 === 0) {
      readyMessage.visible = !readyMessage.visible;
    }

    if (
      this.elapsedBeforeStartOfNextRoundFrame >=
      this.beForeStartOfNextRoundFrameNum
    ) {
      readyMessage.visible = false;
      black.alpha = 0;
      black.visible = false;
      this.elapsedBeforeStartOfNextRoundFrame = 0;
      this.roundEnded = false;
      this.state = this.round;
    }
  }

  // refered FUN_00404070
  gameEnd(delta) {
    const gameEndMessage = this.sprites.messages.gameEnd;
    const w = 96; // game end message texture width;
    const h = 24; // game end message texture height;

    if (this.elapsedGameEndFrame === 0) {
      gameEndMessage.visible = true;
    }
    if (this.elapsedGameEndFrame < 50) {
      const halfWidthIncrement =
        2 * Math.floor(((50 - this.elapsedGameEndFrame) * w) / 50);
      const halfHeightIncrement =
        2 * Math.floor(((50 - this.elapsedGameEndFrame) * h) / 50);

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
    this.elapsedGameEndFrame++;
    if (this.elapsedGameEndFrame > 210) {
      this.elapsedGameEndFrame = 0;
      gameEndMessage.visible = false;
      this.state = this.startOfNewGame;
    }
  }

  drawGraphicForRoundStart(delta) {
    this.physics.player1.initializeForNewRound();
    this.physics.player2.initializeForNewRound();
    this.physics.ball.initializeForNewRound(this.isPlayer2Serve);
    this.drawGraphicForPlayerAndBall();
  }

  drawGraphicForPlayerAndBall() {
    const player1 = this.physics.player1;
    const player2 = this.physics.player2;
    const ball = this.physics.ball;

    const sprites = this.sprites;
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

  showScoreToScoreBoard() {
    for (let i = 0; i < 2; i++) {
      const scoreBoard = this.sprites.scoreBoards[i];
      const score = this.scores[i];
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

  playSoundEffect() {
    const sound = this.physics.sound;
    const audio = this.audio;
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

  // this funtion corresponds to FUN_00404770 in origianl machine (assembly) code
  moveCloudsAndWaves(delta) {
    const clouds = this.clouds;
    const wave = this.wave;

    cloudAndWaveEngine(clouds, wave);

    for (let i = 0; i < NUM_OF_CLOUDS; i++) {
      const cloud = clouds[i];
      const cloudSprite = this.sprites.cloudContainer.getChildAt(i);
      cloudSprite.x = cloud.spriteTopLeftPointX;
      cloudSprite.y = cloud.spriteTopLeftPointY;
      cloudSprite.width = cloud.spriteWidth;
      cloudSprite.height = cloud.spriteHeight;
    }

    for (let i = 0; i < 432 / 16; i++) {
      const waveSprite = this.sprites.waveContainer.getChildAt(i);
      waveSprite.y = wave.yCoords[i];
    }
  }

  //pikaVolley.fightMessageSizeInfo = 0;
  //pikaVolley.fightMessageEnlarged = false;
  // FUN_00405d50
  moveFightMessage(delta) {
    const sizeArray = [20, 22, 25, 27, 30, 27, 25, 22, 20];
    const fightMessageWidth = 160;
    const fightMessageHeight = 160;
    const fightMessage = this.sprites.messages.fight;
    if (this.fightMessageEnlarged === false) {
      if (this.fightMessageSizeInfo === 0) {
        this.sprites.black.visible = false;
        fightMessage.visible = true;
      }
      this.fightMessageSizeInfo += 1;

      const halfWidth = Math.floor(
        Math.floor((this.fightMessageSizeInfo * fightMessageWidth) / 30) / 2
      );
      const halfHeight = Math.floor(
        Math.floor((this.fightMessageSizeInfo * fightMessageHeight) / 30) / 2
      );
      fightMessage.width = halfWidth * 2; // width
      fightMessage.height = halfHeight * 2; // height
      fightMessage.x = 100 - halfWidth; // x coor
      fightMessage.y = 70 - halfHeight; // y coord

      //// iVar3 = code ??
      // FUN_00409690
      if (this.fightMessageSizeInfo > 29) {
        this.fightMessageEnlarged = true;
        // FUN_00408ee0
        //param_1[0x1d] = 200;
        return;
      }
    } else {
      this.fightMessageSizeInfo = (this.fightMessageSizeInfo + 1) % 9;
      // code ...
      const halfWidth = Math.floor(
        Math.floor(
          (sizeArray[this.fightMessageSizeInfo] * fightMessageWidth) / 30
        ) / 2
      );
      const halfHeight = Math.floor(
        Math.floor(
          (sizeArray[this.fightMessageSizeInfo] * fightMessageHeight) / 30
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
