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
    this.bgm = resources[PATH.BGM].sound;
    this.pipikachu = resources[PATH.PIPIKACHU].sound;
    this.pika = resources[PATH.PIKA].sound;
    this.chu = resources[PATH.CHU].sound;
    this.pi = resources[PATH.PI].sound;
    this.pikachu = resources[PATH.PIKACHU].sound;
    this.powerHit = resources[PATH.POWERHIT].sound;
    this.ballTouchesGround = resources[PATH.BALLTOUCHESGROUND].sound;

    this.bgm.loop = true;
    this.adjustVolume(0.3);
    // this.bgm = new Audio("assets/bgm.mp3");
    // this.pipikachu = new Audio("assets/WAVE140_1.wav");
    // this.pika = new Audio("assets/WAVE141_1.wav");
    // this.chu = new Audio("assets/WAVE142_1.wav");
    // this.pi = new Audio("assets/WAVE143_1.wav");
    // this.pikachu = new Audio("assets/WAVE144_1.wav");
    // this.powerHit = new Audio("assets/WAVE145_1.wav");
    // this.ballTouchesGround = new Audio("assets/WAVE146_1.wav");
  }

  // volume: number from 0 to 1
  adjustVolume(volume) {
    for (const prop in this) {
      this[prop].volume = volume;
    }
  }
}
