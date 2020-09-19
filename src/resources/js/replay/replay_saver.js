import { saveAs } from 'file-saver';
import { serialize } from './utils/serialize.js';
import { getHashCode } from './utils/hash_code.js';
import { convertUserInputTo5bitNumber } from './utils/input_conversion.js';
import { getReplayFileCommentText } from './replay_file_comment.js';

/** @typedef {import('../physics.js').PikaUserInput} PikaUserInput */
/** @typedef {{speed: string, winningScore: number}} Options options communicated with the peer */

/**
 * Classs representing replay saver
 */
class ReplaySaver {
  constructor() {
    this.frameCounter = 0;
    this.inputs = []; // number[], the number in the array represents player1, player2 input
    this.options = []; // [frameCounter, options][];
  }

  /**
   * Record user inputs
   * @param {PikaUserInput} player1Input
   * @param {PikaUserInput} player2Input
   */
  recordInputs(player1Input, player2Input) {
    const usersInputNumber =
      (convertUserInputTo5bitNumber(player1Input) << 5) +
      convertUserInputTo5bitNumber(player2Input);
    this.inputs.push(usersInputNumber);
    this.frameCounter++;
  }

  /**
   * Record game options
   * @param {Options} options
   */
  recordOptions(options) {
    this.options.push([this.frameCounter, options]);
  }

  /**
   * Save as a file
   */
  saveAsFile() {
    const pack = {
      version: 'offline-web',
      options: this.options,
      inputs: this.inputs,
      hash: 0,
    };

    // This is for making it annoying to modify/fabricate the replay file.
    // I'm worried about fabricating the replay file and distributing it even if it is unlikely.
    // I doubt about the effect of inserting a hash code. But It would be better than doing nothing.
    const hash = getHashCode(serialize(pack));
    pack.hash = hash;

    const packWithComment = {
      _comment: getReplayFileCommentText(),
      pack: pack,
    };

    const blob = new Blob([JSON.stringify(packWithComment)], {
      type: 'text/plain;charset=utf-8',
    });
    const d = new Date();
    // The code removing illegal characters in Windows by replace method is from:
    // https://stackoverflow.com/a/42210346/8581025
    const filename = `${d.getFullYear()}${('0' + (d.getMonth() + 1)).slice(
      -2
    )}${('0' + d.getDate()).slice(-2)}_${('0' + d.getHours()).slice(-2)}${(
      '0' + d.getMinutes()
    ).slice(-2)}.txt`.replace(/[/\\?%*:|"<>]/g, '_');
    saveAs(blob, filename, { autoBom: true });
  }
}

export const replaySaver = new ReplaySaver();
