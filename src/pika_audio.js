'use strict';
import { RESOURCE_PATH } from './resource_path.js';

const SOUNDS = RESOURCE_PATH.SOUNDS;

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
    this.adjustVolume(0.3);
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
}
