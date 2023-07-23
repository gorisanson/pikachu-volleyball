import seedrandom from 'seedrandom';
import { PikachuVolleyball } from '../pikavolley.js';
import { setCustomRng } from '../rand.js';

import { Cloud, Wave } from '../cloud_and_wave.js';
import { PikaPhysics } from '../physics.js';
import { convert5bitNumberToUserInput } from '../utils/input_conversion.js';
import {
  noticeEndOfReplay,
  moveScrubberTo,
  showKeyboardInputs,
} from './ui_replay.js';
import { setTickerMaxFPSAccordingToNormalFPS } from './replay_player.js';

/** @typedef GameState @type {function():void} */

/**
 * Class reperesenting Pikachu Volleyball Replay
 */
// @ts-ignore
export class PikachuVolleyballReplay extends PikachuVolleyball {
  constructor(stage, resources, roomId, inputs, options) {
    super(stage, resources);

    this.roomId = roomId;
    this.inputs = inputs;
    this.options = options;
    this.player1Keyboard = {
      xDirection: 0,
      yDirection: 0,
      powerHit: 0,
      getInput: () => {},
    };
    this.player2Keyboard = {
      xDirection: 0,
      yDirection: 0,
      powerHit: 0,
      getInput: () => {},
    };
    this.keyboardArray = [this.player1Keyboard, this.player2Keyboard];
    this.willMoveScrubber = true;
    this.willDisplayChat = true;
    this.willSaveReplay = false;

    const fakeSound = {
      play: () => {},
      stop: () => {},
    };
    const fakeBGM = {
      fake: true,
      playing: false,
      play: function () {
        this.playing = true;
      },
      stop: function () {
        this.playing = false;
      },
    };
    this.fakeAudio = {
      sounds: {
        bgm: fakeBGM,
        pipikachu: fakeSound,
        pika: fakeSound,
        chu: fakeSound,
        pi: fakeSound,
        pikachu: fakeSound,
        powerHit: fakeSound,
        ballTouchesGround: fakeSound,
      },
    };

    this.initilizeForReplay();
  }

  /**
   * This is mainly for reinitilization for reusing the PikachuVolleyballReplay object
   */
  initilizeForReplay() {
    // Stop if sounds are playing
    for (const prop in this.audio.sounds) {
      this.audio.sounds[prop].stop();
    }

    this.timeCurrent = 0; // unit: second
    this.timeBGM = 0;
    this.replayFrameCounter = 0;
    this.chatCounter = 0;
    this.optionsCounter = 0;

    // Set the same RNG (used for the game) for both peers
    const customRng = seedrandom.alea(this.roomId.slice(10));
    setCustomRng(customRng);

    // Reinitilize things which needs exact RNG
    this.view.game.cloudArray = [];
    const NUM_OF_CLOUDS = 10;
    for (let i = 0; i < NUM_OF_CLOUDS; i++) {
      this.view.game.cloudArray.push(new Cloud());
    }
    this.view.game.wave = new Wave();
    this.view.intro.visible = false;
    this.view.menu.visible = false;
    this.view.game.visible = false;
    this.view.fadeInOut.visible = false;

    this.physics = new PikaPhysics(true, true);

    this.normalFPS = 30;
    this.slowMotionFPS = 5;
    this.SLOW_MOTION_FRAMES_NUM = 6;
    this.slowMotionFramesLeft = 0;
    this.slowMotionNumOfSkippedFrames = 0;
    this.scores = [0, 0];
    this.winningScore = 15;
    this.gameEnded = false;
    this.roundEnded = false;
    this.isPlayer2Serve = false;
    this.frameCounter = 0;
    this.noInputFrameCounter = 0;

    this.paused = false;
    this.isStereoSound = true;
    this._isPracticeMode = false;
    this.isRoomCreatorPlayer2 = false;
    this.state = this.intro;
  }

  /**
   * Game loop which play no sound, display no chat, does not move scrubber
   */
  gameLoopSilent() {
    const audio = this.audio;
    this.willDisplayChat = false;
    this.willMoveScrubber = false;
    // @ts-ignore
    this.audio = this.fakeAudio;
    this.gameLoop();
    this.willMoveScrubber = true;
    this.willDisplayChat = true;
    this.audio = audio;
  }

  /**
   * Game loop
   * This function should be called at regular intervals ( interval = (1 / FPS) second )
   */
  gameLoop() {
    if (this.replayFrameCounter >= this.inputs.length) {
      noticeEndOfReplay();
      return;
    }

    if (this.willMoveScrubber) {
      moveScrubberTo(this.replayFrameCounter);
    }

    const usersInputNumber = this.inputs[this.replayFrameCounter];
    const player1Input = convert5bitNumberToUserInput(usersInputNumber >>> 5);
    const player2Input = convert5bitNumberToUserInput(
      usersInputNumber % (1 << 5)
    );
    this.player1Keyboard.xDirection = player1Input.xDirection;
    this.player1Keyboard.yDirection = player1Input.yDirection;
    this.player1Keyboard.powerHit = player1Input.powerHit;
    this.player2Keyboard.xDirection = player2Input.xDirection;
    this.player2Keyboard.yDirection = player2Input.yDirection;
    this.player2Keyboard.powerHit = player2Input.powerHit;
    showKeyboardInputs(player1Input, player2Input);

    let options = this.options[this.optionsCounter];
    while (options && options[0] === this.replayFrameCounter) {
      if (options[1].speed) {
        switch (options[1].speed) {
          case 'slow':
            this.normalFPS = 20;
            break;
          case 'medium':
            this.normalFPS = 25;
            break;
          case 'fast':
            this.normalFPS = 30;
            break;
        }
        setTickerMaxFPSAccordingToNormalFPS(this.normalFPS);
      }
      if (options[1].winningScore) {
        switch (options[1].winningScore) {
          case 5:
            this.winningScore = 5;
            break;
          case 10:
            this.winningScore = 10;
            break;
          case 15:
            this.winningScore = 15;
            break;
        }
      }
      if (options[1].restart) {
        console.log('ahah');
        this.restart();
      }
      if (options[1].fps) {
        this.normalFPS = options[1].fps;
        setTickerMaxFPSAccordingToNormalFPS(this.normalFPS);
      }
      this.optionsCounter++;
      options = this.options[this.optionsCounter];
    }
    this.timeCurrent += 1 / this.normalFPS;
    // @ts-ignore
    if (this.audio.sounds.bgm.fake) {
      // @ts-ignore
      if (this.audio.sounds.bgm.playing) {
        this.timeBGM = (this.timeBGM + 1 / this.normalFPS) % 83; // 83 is total duration of bgm
      } else {
        this.timeBGM = 0;
      }
    }

    this.replayFrameCounter++;
    super.gameLoop();
  }
}
