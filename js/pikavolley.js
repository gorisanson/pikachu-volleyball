import { PikaKeyboard } from "./pika_keyboard.js";
import { PikaPhysics } from "./pika_physics.js";
import { PikaAudio } from "./pika_audio.js";
import { GameView } from "./pika_view.js";

export class PikachuVolleyball {
  // pixiApplication: PIXI.Application object
  // pikaSprites: PikaSprites object
  constructor(textures) {
    this.view = {
      game: new GameView(textures)
    };
    //this.sprites = pikaSprites;
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
    this.state = null;

    this.normalFPS = 25;
    this.slowMotionFPS = 5;

    this.SLOW_MOTION_FRAMES_NUM = 6;
    this.slowMotionFramesLeft = 0;
    this.slowMotionNumOfSkippedFrames = 0;

    this.scores = [0, 0]; // scores[0] for player1, scores[1] for player2
    this.goalScore = 15;

    this.gameEnded = false;
    this.roundEnded = false;
    this.isPlayer2Serve = false;

    this.frameCounter = 0;
    this.frameTotal = {
      startOfNewGame: 71,
      afterEndOfRound: 5,
      beforeStartOfNextRound: 30,
      gameEnd: 211
    };
  }

  gameLoop() {
    if (this.slowMotionFramesLeft > 0) {
      this.slowMotionNumOfSkippedFrames++;
      if (
        this.slowMotionNumOfSkippedFrames %
          Math.round(this.normalFPS / this.slowMotionFPS) ===
        0
      ) {
        this.slowMotionFramesLeft--;
        this.slowMotionNumOfSkippedFrames = 0;
        this.state();
      }
    } else {
      this.state();
    }
  }

  startOfNewGame() {
    if (this.frameCounter === 0) {
      this.gameEnded = false;
      this.roundEnded = false;
      this.physics.player1.gameEnded = false;
      this.physics.player1.isWinner = false;
      this.physics.player2.gameEnded = false;
      this.physics.player2.isWinner = false;
      this.isPlayer2Serve = false;

      this.scores[0] = 0;
      this.scores[1] = 0;
      this.view.game.showScoreToScoreBoard(this.scores);

      this.physics.player1.initializeForNewRound();
      this.physics.player2.initializeForNewRound();
      this.physics.ball.initializeForNewRound(this.isPlayer2Serve);
      this.view.game.drawPlayerAndBall(this.physics);

      this.view.game.setFadeInOutBlackAlphaTo(1); // set black screen

      this.audio.bgm.play();
    }

    this.view.game.drawGameStartMessageForFrameNo(
      this.frameCounter,
      this.frameTotal.startOfNewGame
    );
    this.view.game.drawCloudsAndWave();
    this.view.game.changeFadeInOutBlackAlphaBy(-(1 / 17)); // fade in
    this.frameCounter++;

    if (this.frameCounter >= this.frameTotal.startOfNewGame) {
      this.frameCounter = 0;
      this.view.game.setFadeInOutBlackAlphaTo(0);
      this.state = this.round;
    }
  }

  round() {
    // catch keyboard input and freeze it
    this.keyboardArray[0].updateProperties();
    this.keyboardArray[1].updateProperties();

    const isBallTouchingGround = this.physics.runEngineForNextFrame(
      this.keyboardArray
    );

    this.playSoundEffect();
    this.view.game.drawPlayerAndBall(this.physics);
    this.view.game.drawCloudsAndWave();

    if (this.gameEnded === true) {
      this.view.game.drawGameEndMessageForFrameNo(
        this.elapsedGameEndFrame,
        this.gameEndFrameNum
      );
      this.elapsedGameEndFrame++;
      if (this.elapsedGameEndFrame >= this.gameEndFrameNum) {
        this.elapsedGameEndFrame = 0;
        this.state = this.startOfNewGame;
      }
      return;
    }

    if (
      isBallTouchingGround &&
      this.roundEnded === false &&
      this.gameEnded === false
    ) {
      if (this.physics.ball.punchEffectX < 216) {
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
      this.view.game.showScoreToScoreBoard(this.scores);
      if (this.roundEnded === false && this.gameEnded === false) {
        this.slowMotionFramesLeft = this.SLOW_MOTION_FRAMES_NUM;
      }
      this.roundEnded = true;
    }

    if (this.roundEnded === true && this.gameEnded === false) {
      // if this is the last frame of this round, begin fade out
      if (this.slowMotionFramesLeft === 0) {
        this.view.game.changeFadeInOutBlackAlphaBy(1 / 16); // fade out
        this.state = this.afterEndOfRound;
      }
    }
  }

  afterEndOfRound() {
    this.view.game.changeFadeInOutBlackAlphaBy(1 / 16);
    this.frameCounter++;
    if (this.frameCounter >= this.frameTotal.afterEndOfRound) {
      this.frameCounter = 0;
      this.state = this.beforeStartOfNextRound;
    }
  }

  beforeStartOfNextRound() {
    if (this.frameCounter === 0) {
      this.view.game.setFadeInOutBlackAlphaTo(1);
      this.view.game.showReadyMessage(false);

      this.physics.player1.initializeForNewRound();
      this.physics.player2.initializeForNewRound();
      this.physics.ball.initializeForNewRound(this.isPlayer2Serve);
      this.view.game.drawPlayerAndBall(this.physics);
    }

    this.view.game.drawCloudsAndWave();
    this.view.game.changeFadeInOutBlackAlphaBy(-(1 / 16));

    this.frameCounter++;
    if (this.frameCounter % 5 === 0) {
      this.view.game.toggleReadyMessage();
    }

    if (this.frameCounter >= this.frameTotal.beforeStartOfNextRound) {
      this.frameCounter = 0;
      this.view.game.showReadyMessage(false);
      this.view.game.setFadeInOutBlackAlphaTo(0);
      this.roundEnded = false;
      this.state = this.round;
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

  //pikaVolley.fightMessageSizeInfo = 0;
  //pikaVolley.fightMessageEnlarged = false;
  // FUN_00405d50
  moveFightMessage() {
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
      this.
      : null
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
