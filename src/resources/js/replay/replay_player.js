'use strict';
import { settings } from '@pixi/settings';
import { SCALE_MODES } from '@pixi/constants';
import { Renderer, BatchRenderer, autoDetectRenderer } from '@pixi/core';
import { Prepare } from '@pixi/prepare';
import { Container } from '@pixi/display';
import { Loader } from '@pixi/loaders';
import { SpritesheetLoader } from '@pixi/spritesheet';
import { Ticker } from '@pixi/ticker';
import { CanvasRenderer } from '@pixi/canvas-renderer';
import { CanvasSpriteRenderer } from '@pixi/canvas-sprite';
import { CanvasPrepare } from '@pixi/canvas-prepare';
import '@pixi/canvas-display';
import { ASSETS_PATH } from '../assets_path.js';
import { PikachuVolleyballReplay } from './pikavolley_replay.js';
import {
  setMaxForScrubberRange,
  adjustPlayPauseBtnIcon,
  showTotalTimeDuration,
  showTimeCurrent,
  enableReplayScrubberAndBtns,
  hideNoticeEndOfReplay,
  noticeFileOpenError,
  adjustFPSInputValue,
} from './ui_replay.js';
import '../../replay.css';
import { serialize } from '../utils/serialize.js';
import { getHashCode } from '../utils/hash_code.js';

class ReplayPlayer {
  constructor() {
    // Reference for how to use Renderer.registerPlugin:
    // https://github.com/pixijs/pixijs/blob/af3c0c6bb15aeb1049178c972e4a14bb4cabfce4/bundles/pixi.js/src/index.ts#L27-L34
    Renderer.registerPlugin('prepare', Prepare);
    Renderer.registerPlugin('batch', BatchRenderer);
    // Reference for how to use CanvasRenderer.registerPlugin:
    // https://github.com/pixijs/pixijs/blob/af3c0c6bb15aeb1049178c972e4a14bb4cabfce4/bundles/pixi.js-legacy/src/index.ts#L13-L19
    CanvasRenderer.registerPlugin('prepare', CanvasPrepare);
    CanvasRenderer.registerPlugin('sprite', CanvasSpriteRenderer);
    Loader.registerPlugin(SpritesheetLoader);
    settings.RESOLUTION = Math.ceil(window.devicePixelRatio);
    settings.SCALE_MODE = SCALE_MODES.NEAREST;
    settings.ROUND_PIXELS = true;

    this.ticker = new Ticker();
    this.ticker.minFPS = 1;
    this.renderer = autoDetectRenderer({
      width: 432,
      height: 304,
      antialias: false,
      backgroundColor: 0x000000,
      backgroundAlpha: 1,
      forceCanvas: true,
    });
    this.stage = new Container();
    this.loader = new Loader();
    this.pikaVolley = null;
    this.playBackSpeedTimes = 1;
    this.playBackSpeedFPS = null;
  }

  readFile(file) {
    // Adjust PIXI settings;
    settings.RESOLUTION = Math.ceil(window.devicePixelRatio);
    settings.SCALE_MODE = SCALE_MODES.NEAREST;
    settings.ROUND_PIXELS = true;

    // // To show two "with friend" on the menu
    // const TEXTURES = ASSETS_PATH.TEXTURES;
    // TEXTURES.WITH_COMPUTER = TEXTURES.WITH_FRIEND;

    document
      .querySelector('#game-canvas-container')
      .appendChild(this.renderer.view);

    this.renderer.render(this.stage); // To make the initial canvas painting stable in the Firefox browser.
    this.ticker.add(() => {
      // Redering and gameLoop order is the opposite of
      // the offline web version (refer: ./offline_version_js/main.js).
      // It's for the smooth rendering for the online version
      // which gameLoop can not always succeed right on this "ticker.add"ed code
      // because of the transfer delay or connection status. (If gameLoop here fails,
      // it is recovered by the callback gameLoop which is called after peer input received.)
      // Now the rendering is delayed 40ms (when pikaVolley.normalFPS == 25)
      // behind gameLoop.
      this.renderer.render(this.stage);
      showTimeCurrent(this.pikaVolley.timeCurrent);
      this.pikaVolley.gameLoop();
    });

    this.loader.add(ASSETS_PATH.SPRITE_SHEET);
    for (const prop in ASSETS_PATH.SOUNDS) {
      this.loader.add(ASSETS_PATH.SOUNDS[prop]);
    }
    setUpLoaderProgresBar(this.loader);

    const reader = new FileReader();
    reader.onload = (event) => {
      let packWithComment;
      let pack;
      try {
        // @ts-ignore
        packWithComment = JSON.parse(event.target.result);
        pack = packWithComment.pack;
        const hash = pack.hash;
        pack.hash = 0;
        if (hash !== getHashCode(serialize(pack))) {
          throw 'Error: The file content is not matching the hash code';
        }
      } catch (err) {
        console.log(err);
        noticeFileOpenError();
        return;
      }
      showTotalTimeDuration(getTotalTimeDuration(pack));
      this.loader.load(() => {
        this.pikaVolley = new PikachuVolleyballReplay(
          this.stage,
          this.loader.resources,
          pack.roomID,
          pack.inputs,
          pack.options
        );
        // @ts-ignore
        setMaxForScrubberRange(pack.inputs.length);
        this.seekFrame(0);
        this.ticker.start();
        adjustPlayPauseBtnIcon();
        enableReplayScrubberAndBtns();
      });
    };
    try {
      reader.readAsText(file);
    } catch (err) {
      console.log(err);
      noticeFileOpenError();
      return;
    }
  }

  /**
   * Seek the specific frame
   * @param {number} frameNumber
   */
  seekFrame(frameNumber) {
    hideNoticeEndOfReplay();
    this.ticker.stop();

    // Cleanup previous pikaVolley
    this.pikaVolley.initilizeForReplay();

    if (frameNumber > 0) {
      for (let i = 0; i < frameNumber; i++) {
        this.pikaVolley.gameLoopSilent();
      }
      this.renderer.render(this.stage);
    }
    showTimeCurrent(this.pikaVolley.timeCurrent);
  }

  /**
   * Seek forward/backward the relative time (seconds).
   * @param {number} seconds plus value for seeking forward, minus value for seeking backward
   */
  seekRelativeTime(seconds) {
    const seekFrameCounter = Math.max(
      0,
      this.pikaVolley.replayFrameCounter + seconds * this.pikaVolley.normalFPS
    );
    this.seekFrame(seekFrameCounter);
  }

  /**
   * Adjust playback speed by times
   * @param {number} times
   */
  adjustPlaybackSpeedTimes(times) {
    this.playBackSpeedFPS = null;
    this.playBackSpeedTimes = times;
    this.ticker.maxFPS = this.pikaVolley.normalFPS * this.playBackSpeedTimes;
    adjustFPSInputValue();
  }

  /**
   * Adjust playback speed by fps
   * @param {number} fps
   */
  adjustPlaybackSpeedFPS(fps) {
    this.playBackSpeedTimes = null;
    this.playBackSpeedFPS = fps;
    this.ticker.maxFPS = this.playBackSpeedFPS;
    adjustFPSInputValue();
  }

  stopBGM() {
    this.pikaVolley.audio.sounds.bgm.center.stop();
  }

  pauseBGM() {
    this.pikaVolley.audio.sounds.bgm.center.pause();
  }

  resumeBGM() {
    this.pikaVolley.audio.sounds.bgm.center.resume();
  }

  playBGMProperlyAfterScrubbbing() {
    if (this.pikaVolley.fakeAudio.sounds.bgm.playing) {
      this.pikaVolley.audio.sounds.bgm.center.play({
        start: this.pikaVolley.timeBGM,
      });
    }
  }
}

export const replayPlayer = new ReplayPlayer();

/**
 * Set ticker.maxFPS according to PikachuVolleyball object's normalFPS properly
 * @param {number} normalFPS
 */
export function setTickerMaxFPSAccordingToNormalFPS(normalFPS) {
  if (replayPlayer.playBackSpeedFPS) {
    replayPlayer.ticker.maxFPS = replayPlayer.playBackSpeedFPS;
    adjustFPSInputValue();
  } else if (replayPlayer.playBackSpeedTimes) {
    replayPlayer.ticker.maxFPS = normalFPS * replayPlayer.playBackSpeedTimes;
    adjustFPSInputValue();
  }
}

/**
 * Set up the loader progress bar.
 * @param {Loader} loader
 */
function setUpLoaderProgresBar(loader) {
  const loadingBox = document.getElementById('loading-box');
  const progressBar = document.getElementById('progress-bar');

  loader.onProgress.add(() => {
    progressBar.style.width = `${loader.progress}%`;
  });
  loader.onComplete.add(() => {
    if (!loadingBox.classList.contains('hidden')) {
      loadingBox.classList.add('hidden');
    }
  });
}

/**
 * Get total time duration for the pack
 * @param {Object} pack
 */
function getTotalTimeDuration(pack) {
  const speedChangeRecord = [];

  let optionsCounter = 0;
  let options = pack.options[optionsCounter];
  while (options) {
    if (options[1].speed) {
      let fpsFromNowOn = null;
      switch (options[1].speed) {
        case 'slow':
          fpsFromNowOn = 20;
          break;
        case 'medium':
          fpsFromNowOn = 25;
          break;
        case 'fast':
          fpsFromNowOn = 30;
          break;
      }
      const frameCounter = options[0];
      speedChangeRecord.push([frameCounter, fpsFromNowOn]);
    }
    optionsCounter++;
    options = pack.options[optionsCounter];
  }

  let timeDuration = 0; // unit: second
  let currentFrameCounter = 0;
  let currentFPS = 25;
  for (let i = 0; i < speedChangeRecord.length; i++) {
    const futureFrameCounter = speedChangeRecord[i][0];
    const futureFPS = speedChangeRecord[i][1];
    timeDuration += (futureFrameCounter - currentFrameCounter) / currentFPS;
    currentFrameCounter = futureFrameCounter;
    currentFPS = futureFPS;
  }
  timeDuration += (pack.inputs.length - currentFrameCounter) / currentFPS;

  return timeDuration;
}
