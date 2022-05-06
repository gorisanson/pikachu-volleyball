/**
 * This module takes charge of the game audio (or sounds)
 */
'use strict';
import { sound, Sound, filters } from '@pixi/sound';
import { ASSETS_PATH } from './assets_path.js';

const SOUNDS = ASSETS_PATH.SOUNDS;

/** @typedef {import('@pixi/loaders').LoaderResource} LoaderResource */

/**
 * Class represeting audio
 */
export class PikaAudio {
  /**
   * Create a PikaAudio object
   * @param {Object.<string,LoaderResource>} resources loader.resources
   */
  constructor(resources) {
    /** @type {Object.<string,PikaStereoSound>} sounds pack */
    this.sounds = {
      bgm: new PikaStereoSound(resources[SOUNDS.BGM].sound),
      pipikachu: new PikaStereoSound(resources[SOUNDS.PIPIKACHU].sound),
      pika: new PikaStereoSound(resources[SOUNDS.PIKA].sound),
      chu: new PikaStereoSound(resources[SOUNDS.CHU].sound),
      pi: new PikaStereoSound(resources[SOUNDS.PI].sound),
      pikachu: new PikaStereoSound(resources[SOUNDS.PIKACHU].sound),
      powerHit: new PikaStereoSound(resources[SOUNDS.POWERHIT].sound),
      ballTouchesGround: new PikaStereoSound(
        resources[SOUNDS.BALLTOUCHESGROUND].sound
      ),
    };

    this.sounds.bgm.loop = true;
    /** @constant @type {number} proper bgm volume */
    this.properBGMVolume = 0.2;
    /** @constant @type {number} proper sfx volume */
    this.properSFXVolume = 0.35;
    this.adjustVolume();
  }

  /**
   * Adjust audio volume
   */
  adjustVolume() {
    for (const prop in this.sounds) {
      if (prop === 'bgm') {
        this.sounds[prop].volume = this.properBGMVolume;
      } else {
        this.sounds[prop].volume = this.properSFXVolume;
      }
    }
  }

  /**
   * turn BGM volume
   * @param {boolean} turnOn turnOn? turnOff
   */
  turnBGMVolume(turnOn) {
    let volume;
    if (turnOn) {
      volume = this.properBGMVolume;
    } else {
      volume = 0;
    }
    this.sounds.bgm.volume = volume;
  }

  /**
   * turn SFX volume
   * @param {boolean} turnOn turnOn? turnOff
   */
  turnSFXVolume(turnOn) {
    let volume;
    if (turnOn) {
      volume = this.properSFXVolume;
    } else {
      volume = 0;
    }
    for (const prop in this.sounds) {
      if (prop !== 'bgm') {
        this.sounds[prop].volume = volume;
      }
    }
  }

  muteAll() {
    sound.muteAll();
  }

  unmuteAll() {
    sound.unmuteAll();
  }
}

/**
 * Class representing a stereo sound
 */
class PikaStereoSound {
  /**
   * create a PikaStereoSound object
   * @param {Sound} sound
   */
  constructor(sound) {
    this.center = sound;
    this.left = Sound.from(sound.url);
    this.right = Sound.from(sound.url);

    const centerPanning = new filters.StereoFilter(0);
    const leftPanning = new filters.StereoFilter(-0.75);
    const rightPanning = new filters.StereoFilter(0.75);
    this.center.filters = [centerPanning];
    this.left.filters = [leftPanning];
    this.right.filters = [rightPanning];
  }

  /**
   * @param {number} v volume: number in [0, 1]
   */
  set volume(v) {
    this.center.volume = v;
    this.left.volume = v;
    this.right.volume = v;
  }

  /**
   * @param {boolean} bool
   */
  set loop(bool) {
    this.center.loop = bool;
    this.left.loop = bool;
    this.right.loop = bool;
  }

  /**
   * play this stereo sound
   * @param {number} leftOrCenterOrRight -1: left, 0: center, 1: right
   */
  play(leftOrCenterOrRight = 0) {
    if (leftOrCenterOrRight === 0) {
      this.center.play();
    } else if (leftOrCenterOrRight === -1) {
      this.left.play();
    } else if (leftOrCenterOrRight === 1) {
      this.right.play();
    }
  }

  /**
   * stop this stereo sound
   */
  stop() {
    this.center.stop();
    this.left.stop();
    this.right.stop();
  }
}
