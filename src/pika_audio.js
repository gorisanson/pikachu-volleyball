export const PATH = {};
PATH.BGM = 'assets/bgm.mp3';
PATH.PIPIKACHU = 'assets/WAVE140_1.wav';
PATH.PIKA = 'assets/WAVE141_1.wav';
PATH.CHU = 'assets/WAVE142_1.wav';
PATH.PI = 'assets/WAVE143_1.wav';
PATH.PIKACHU = 'assets/WAVE144_1.wav';
PATH.POWERHIT = 'assets/WAVE145_1.wav';
PATH.BALLTOUCHESGROUND = 'assets/WAVE146_1.wav';

/**
 * Class represeting audio
 */
export class PikaAudio {
  constructor(resources) {
    /** @type {Object.<string,PIXI.sound.Sound>} sounds pack */
    this.sounds = {
      bgm: resources[PATH.BGM].sound,
      pipikachu: resources[PATH.PIPIKACHU].sound,
      pika: resources[PATH.PIKA].sound,
      chu: resources[PATH.CHU].sound,
      pi: resources[PATH.PI].sound,
      pikachu: resources[PATH.PIKACHU].sound,
      powerHit: resources[PATH.POWERHIT].sound,
      ballTouchesGround: resources[PATH.BALLTOUCHESGROUND].sound
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
