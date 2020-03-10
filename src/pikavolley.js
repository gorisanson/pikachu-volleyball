import { PikaKeyboard } from './pika_keyboard.js';
import { PikaPhysics } from './pika_physics.js';
import { PikaAudio } from './pika_audio.js';
import { MenuView, GameView, FadeInOut, IntroView } from './pika_view.js';

export class PikachuVolleyball {
  // stage: PIXI.Container object which is rendered by PIXI.Renderer or PIXI.CanvasRenderer
  // resources: resources property of the PIXI.Loader object which is used for loading the game resources
  constructor(stage, resources) {
    this.view = {
      intro: new IntroView(resources),
      menu: new MenuView(resources),
      game: new GameView(resources),
      fadeInOut: new FadeInOut()
    };
    stage.addChild(this.view.intro.container);
    stage.addChild(this.view.menu.container);
    stage.addChild(this.view.game.container);
    stage.addChild(this.view.fadeInOut.black);
    this.view.intro.visible = false;
    this.view.menu.visible = false;
    this.view.game.visible = false;
    this.view.fadeInOut.visible = false;

    //this.sprites = pikaSprites;
    this.audio = new PikaAudio(resources);
    this.physics = new PikaPhysics(true, false);
    this.keyboardArray = [
      new PikaKeyboard('d', 'g', 'r', 'f', 'z'), // for player1
      new PikaKeyboard( // for player2
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Enter'
      )
    ];

    this.normalFPS = 25;
    this.slowMotionFPS = 5;

    this.SLOW_MOTION_FRAMES_NUM = 6;
    this.slowMotionFramesLeft = 0;
    this.slowMotionNumOfSkippedFrames = 0;

    this.selectedWithWho = 0; // 0: with computer, 1: with friend

    this.scores = [0, 0]; // scores[0] for player1, scores[1] for player2
    this.goalScore = 15;

    this.gameEnded = false;
    this.roundEnded = false;
    this.isPlayer2Serve = false;

    this.frameCounter = 0;
    this.frameTotal = {
      intro: 165,
      afterMenuSelection: 15,
      beforeStartOfNewGame: 15,
      startOfNewGame: 71,
      afterEndOfRound: 5,
      beforeStartOfNextRound: 30,
      gameEnd: 211
    };

    this.state = this.intro;
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

  intro() {
    if (this.frameCounter === 0) {
      this.view.intro.visible = true;
      this.view.fadeInOut.setBlackAlphaTo(0);
      this.audio.bgm.stop();
    }
    this.view.intro.drawMark(this.frameCounter);
    this.frameCounter++;

    const keyboardArray = this.keyboardArray;
    keyboardArray[0].updateProperties();
    keyboardArray[1].updateProperties();
    if (
      this.keyboardArray[0].powerHit === 1 ||
      this.keyboardArray[1].powerHit === 1
    ) {
      this.frameCounter = 0;
      this.view.intro.visible = false;
      this.state = this.menu;
    }

    if (this.frameCounter >= this.frameTotal.intro) {
      this.frameCounter = 0;
      this.view.intro.visible = false;
      this.state = this.menu;
    }
  }

  menu() {
    if (this.frameCounter === 0) {
      this.view.menu.visible = true;
      this.view.fadeInOut.setBlackAlphaTo(0);
      this.selectedWithWho = 0;
      this.view.menu.selectWithWho(this.selectedWithWho);
    }
    this.view.menu.drawFightMessage(this.frameCounter);
    this.view.menu.drawSachisoft(this.frameCounter);
    this.view.menu.drawSittingPikachuTiles(this.frameCounter);
    this.view.menu.drawPikachuVolleyballMessage(this.frameCounter);
    this.view.menu.drawPokemonMessage(this.frameCounter);
    this.view.menu.drawWithWhoMessages(this.frameCounter);
    this.frameCounter++;

    const keyboardArray = this.keyboardArray;
    keyboardArray[0].updateProperties();
    keyboardArray[1].updateProperties();
    if (
      this.frameCounter < 71 &&
      (keyboardArray[0].powerHit === 1 || keyboardArray[1].powerHit === 1)
    ) {
      this.frameCounter = 71;
      return;
    }

    if (this.frameCounter <= 71) {
      return;
    }

    if (
      (keyboardArray[0].yDirection === -1 ||
        keyboardArray[1].yDirection === -1) &&
      this.selectedWithWho === 1
    ) {
      this.selectedWithWho = 0;
      this.view.menu.selectWithWho(this.selectedWithWho);
      this.audio.pi.play();
      // If I use the normal code above...
      // When I fastly alternate between up arrow and down arrow key,
      // the "pi" sound does not respond to it. But the original game does it.
      // So I use this below code since I love the "pipipipi~" sound.
      //new Audio("assets/WAVE143_1.wav").play();
    } else if (
      (keyboardArray[0].yDirection === 1 ||
        keyboardArray[1].yDirection === 1) &&
      this.selectedWithWho === 0
    ) {
      this.selectedWithWho = 1;
      this.view.menu.selectWithWho(this.selectedWithWho);
      this.audio.pi.play();
      // refer the comment above
      //new Audio("assets/WAVE143_1.wav").play();
    }
    if (
      this.keyboardArray[0].powerHit === 1 ||
      this.keyboardArray[1].powerHit === 1
    ) {
      if (this.selectedWithWho === 1) {
        this.physics.player1.isComputer = false;
        this.physics.player2.isComputer = false;
      } else {
        if (this.keyboardArray[0].powerHit === 1) {
          this.physics.player1.isComputer = false;
          this.physics.player2.isComputer = true;
        } else if (this.keyboardArray[1].powerHit === 1) {
          this.physics.player1.isComputer = true;
          this.physics.player2.isComputer = false;
        }
      }
      this.audio.pikachu.play();
      this.frameCounter = 0;
      this.state = this.afterMenuSelection;
    }
  }

  afterMenuSelection() {
    this.view.fadeInOut.changeBlackAlphaBy(1 / 16);
    this.frameCounter++;
    if (this.frameCounter >= this.frameTotal.afterMenuSelection) {
      this.frameCounter = 0;
      this.state = this.beforeStartOfNewGame;
    }
  }

  // for delay before start of the original game
  beforeStartOfNewGame() {
    this.frameCounter++;
    if (this.frameCounter >= this.frameTotal.beforeStartOfNewGame) {
      this.frameCounter = 0;
      this.view.menu.visible = false;
      this.state = this.startOfNewGame;
    }
  }

  startOfNewGame() {
    if (this.frameCounter === 0) {
      this.view.game.visible = true;
      this.gameEnded = false;
      this.roundEnded = false;
      this.physics.player1.gameEnded = false;
      this.physics.player1.isWinner = false;
      this.physics.player2.gameEnded = false;
      this.physics.player2.isWinner = false;
      this.isPlayer2Serve = false;

      this.scores[0] = 0;
      this.scores[1] = 0;
      this.view.game.drawScoresToScoreBoards(this.scores);

      this.physics.player1.initializeForNewRound();
      this.physics.player2.initializeForNewRound();
      this.physics.ball.initializeForNewRound(this.isPlayer2Serve);
      this.view.game.drawPlayerAndBall(this.physics);

      this.view.fadeInOut.setBlackAlphaTo(1); // set black screen
      this.audio.bgm.play();
    }

    this.view.game.drawGameStartMessage(
      this.frameCounter,
      this.frameTotal.startOfNewGame
    );
    this.view.game.drawCloudsAndWave();
    this.view.fadeInOut.changeBlackAlphaBy(-(1 / 17)); // fade in
    this.frameCounter++;

    if (this.frameCounter >= this.frameTotal.startOfNewGame) {
      this.frameCounter = 0;
      this.view.fadeInOut.setBlackAlphaTo(0);
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
      this.view.game.drawGameEndMessage(this.frameCounter);
      this.frameCounter++;
      if (
        this.frameCounter >= this.frameTotal.gameEnd ||
        (this.frameCounter >= 70 &&
          (this.keyboardArray[0].powerHit === 1 ||
            this.keyboardArray[1].powerHit === 1))
      ) {
        this.frameCounter = 0;
        this.view.game.visible = false;
        this.state = this.intro;
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
      this.view.game.drawScoresToScoreBoards(this.scores);
      if (this.roundEnded === false && this.gameEnded === false) {
        this.slowMotionFramesLeft = this.SLOW_MOTION_FRAMES_NUM;
      }
      this.roundEnded = true;
    }

    if (this.roundEnded === true && this.gameEnded === false) {
      // if this is the last frame of this round, begin fade out
      if (this.slowMotionFramesLeft === 0) {
        this.view.fadeInOut.changeBlackAlphaBy(1 / 16); // fade out
        this.state = this.afterEndOfRound;
      }
    }
  }

  afterEndOfRound() {
    this.view.fadeInOut.changeBlackAlphaBy(1 / 16);
    this.frameCounter++;
    if (this.frameCounter >= this.frameTotal.afterEndOfRound) {
      this.frameCounter = 0;
      this.state = this.beforeStartOfNextRound;
    }
  }

  beforeStartOfNextRound() {
    if (this.frameCounter === 0) {
      this.view.fadeInOut.setBlackAlphaTo(1);
      this.view.game.drawReadyMessage(false);

      this.physics.player1.initializeForNewRound();
      this.physics.player2.initializeForNewRound();
      this.physics.ball.initializeForNewRound(this.isPlayer2Serve);
      this.view.game.drawPlayerAndBall(this.physics);
    }

    this.view.game.drawCloudsAndWave();
    this.view.fadeInOut.changeBlackAlphaBy(-(1 / 16));

    this.frameCounter++;
    if (this.frameCounter % 5 === 0) {
      this.view.game.toggleReadyMessage();
    }

    if (this.frameCounter >= this.frameTotal.beforeStartOfNextRound) {
      this.frameCounter = 0;
      this.view.game.drawReadyMessage(false);
      this.view.fadeInOut.setBlackAlphaTo(0);
      this.roundEnded = false;
      this.state = this.round;
    }
  }

  playSoundEffect() {
    const audio = this.audio;
    for (let i = 0; i < 2; i++) {
      const player = this.physics[`player${i + 1}`];
      const sound = player.sound;
      //const pan = 0;
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
    }
    const ball = this.physics.ball;
    const sound = ball.sound;
    //const pan = 0;
    if (sound.powerHit === true) {
      audio.powerHit.play();
      sound.powerHit = false;
    }
    if (sound.ballTouchesGround === true) {
      audio.ballTouchesGround.play();
      sound.ballTouchesGround = false;
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
