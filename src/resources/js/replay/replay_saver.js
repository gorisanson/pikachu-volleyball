import { saveAs } from 'file-saver';
import { serialize } from '../utils/serialize.js';
import { getHashCode } from '../utils/hash_code.js';
import { convertUserInputTo5bitNumber } from '../utils/input_conversion.js';

/** @typedef {import('../physics.js').PikaUserInput} PikaUserInput */
/** @typedef {{speed: string, winningScore: number}} Options options communicated with the peer */

/**
 * Classs representing replay saver
 */
class ReplaySaver {
  constructor() {
    this.frameCounter = 0;
    this.roomID = ''; // used for set RNGs
    this.nicknames = ['', '']; // [0]: room creator's nickname, [1]: room joiner's nickname
    this.partialPublicIPs = ['', '']; // [0]: room creator's partial public IP address, [1]: room joiner's partial public IP address
    this.inputs = []; // number[], the number in the array represents player1, player2 input
    this.options = [[0, { speed: 'fast', winningScore: 15 }]]; // [frameCounter, options][];
    this.chats = []; // [frameCounter, playerIndex (1 or 2), chatMessage][]
  }

  /**
   * Record room ID for RNGs to be used for replay
   * @param {string} roomID
   */
  recordRoomID(roomID) {
    this.roomID = roomID;
  }

  /**
   * Record nicknames
   * @param {string} roomCreatorNickname
   * @param {string} roomJoinerNickname
   */
  recordNicknames(roomCreatorNickname, roomJoinerNickname) {
    this.nicknames[0] = roomCreatorNickname;
    this.nicknames[1] = roomJoinerNickname;
  }

  /**
   * Record partial public ips
   * @param {string} roomCreatorPartialPublicIP
   * @param {string} roomJoinerPartialPublicIP
   */
  recordPartialPublicIPs(
    roomCreatorPartialPublicIP,
    roomJoinerPartialPublicIP
  ) {
    this.partialPublicIPs[0] = roomCreatorPartialPublicIP;
    this.partialPublicIPs[1] = roomJoinerPartialPublicIP;
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

  cleanRecord() {
    this.inputs = [];
    this.frameCounter = 0;
  }

  /**
   * Record game options
   * @param {Options} options
   */
  recordOptions(options) {
    this.options.push([this.frameCounter, options]);
  }

  /**
   * Record a chat message
   * @param {string} chatMessage
   * @param {number} whichPlayerSide 1 or 2
   */
  recordChats(chatMessage, whichPlayerSide) {
    this.chats.push([this.frameCounter, whichPlayerSide, chatMessage]);
  }

  /**
   * Save as a file
   */
  saveAsFile() {
    const pack = {
      version: 'p2p-online',
      roomID: this.roomID,
      nicknames: this.nicknames,
      partialPublicIPs: this.partialPublicIPs,
      chats: this.chats,
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
      _comment:
        'Replay Viewer at: https://gorisanson.github.io/pikachu-volleyball-p2p-online/en/replay/',
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
    ).slice(-2)}_${this.nicknames[0]}_${this.partialPublicIPs[0].replace(
      '.*.*',
      ''
    )}_vs_${this.nicknames[1]}_${this.partialPublicIPs[1].replace(
      '.*.*',
      ''
    )}.txt`.replace(/[/\\?%*:|"<>]/g, '_');
    saveAs(blob, filename, { autoBom: true });
  }
}

export const replaySaver = new ReplaySaver();
