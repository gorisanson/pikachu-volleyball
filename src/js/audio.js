/*
 * This module takes charge of the game audio (or sounds)
 */
'use strict';
import { ASSETS_PATH } from './assets_path.js';

const SOUNDS = ASSETS_PATH.SOUNDS;

/**
 * Class represeting audio
 */
export class PikaAudio {
  constructor(resources) {
    /** @type {Object.<string,PIXI.sound.Sound>} sounds pack */
    this.sounds = {
      bgm: resources[SOUNDS.BGM].sound,
      pipikachu: resources[SOUNDS.PIPIKACHU].sound,
      pika: resources[SOUNDS.PIKA].sound,
      chu: resources[SOUNDS.CHU].sound,
      pi: resources[SOUNDS.PI].sound,
      pikachu: resources[SOUNDS.PIKACHU].sound,
      powerHit: resources[SOUNDS.POWERHIT].sound,
      ballTouchesGround: resources[SOUNDS.BALLTOUCHESGROUND].sound
    };
    this.sounds.bgm.loop = true;
    /** @type {number} number in [0, 1] */
    this.properVolume = 0.2;
    this.adjustVolume(this.properVolume);
  }

  /**
   * Adjust audio volume
   * @param {number} volume number in [0, 1]
   */
  adjustVolume(volume) {
    for (const prop in this.sounds) {
      this.sounds[prop].volume = volume;
    }
  }

  /**
   * turn BGM volume
   * @param {boolean} turnOn turnOn? turnOff
   */
  turnBGMVolume(turnOn) {
    let volume;
    if (turnOn) {
      volume = this.properVolume;
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
      volume = this.properVolume;
    } else {
      volume = 0;
    }
    for (const prop in this.sounds) {
      if (prop !== 'bgm') {
        this.sounds[prop].volume = volume;
      }
    }
  }
}
