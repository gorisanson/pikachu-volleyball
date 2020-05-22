/**
 * This module takes charge of the user input via keyboard
 */
'use strict';
import { PikaUserInput } from './physics.js';

/**
 * Class representing a keyboard used to contorl a player
 */
export class PikaKeyboard extends PikaUserInput {
  /**
   * Create a keyboard used for game controller
   * left, right, up, down, powerHit: KeyboardEvent.code value for each
   * Refer {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values}
   * @param {string} left KeyboardEvent.code value of the key to use for left
   * @param {string} right KeyboardEvent.code value of the key to use for right
   * @param {string} up KeyboardEvent.code value of the key to use for up
   * @param {string} down KeyboardEvent.code value of the key to use for down
   * @param {string} powerHit KeyboardEvent.code value of the key to use for power hit or selection
   * @param {string} downRight KeyboardEvent.code value of the key to use for having the same effect
   *                           when pressing down key and right key at the same time (Only player 1
   *                           has this key)
   */
  constructor(left, right, up, down, powerHit, downRight = null) {
    super();

    /** @type {boolean} */
    this.powerHitKeyIsDownPrevious = false;

    /** @type {Key} */
    this.leftKey = new Key(left);
    /** @type {Key} */
    this.rightKey = new Key(right);
    /** @type {Key} */
    this.upKey = new Key(up);
    /** @type {Key} */
    this.downKey = new Key(down);
    /** @type {Key} */
    this.powerHitKey = new Key(powerHit);
    /** @type {Key} */
    this.downRightKey = new Key(downRight);
  }

  /**
   * Get xDirection, yDirection, powerHit input from the keyboard.
   * This method is for freezing the keyboard input during the process of one game frame.
   */
  getInput() {
    if (this.leftKey.isDown) {
      this.xDirection = -1;
    } else if (
      this.rightKey.isDown ||
      (this.downRightKey && this.downRightKey.isDown)
    ) {
      this.xDirection = 1;
    } else {
      this.xDirection = 0;
    }

    if (this.upKey.isDown) {
      this.yDirection = -1;
    } else if (
      this.downKey.isDown ||
      (this.downRightKey && this.downRightKey.isDown)
    ) {
      this.yDirection = 1;
    } else {
      this.yDirection = 0;
    }

    const isDown = this.powerHitKey.isDown;
    if (!this.powerHitKeyIsDownPrevious && isDown) {
      this.powerHit = 1;
    } else {
      this.powerHit = 0;
    }
    this.powerHitKeyIsDownPrevious = isDown;
  }

  /**
   * Subscribe keydown, keyup event listners for the keys of this keyboard
   */
  subscribe() {
    this.leftKey.subscribe();
    this.rightKey.subscribe();
    this.upKey.subscribe();
    this.downKey.subscribe();
    this.powerHitKey.subscribe();
    this.downRightKey.subscribe();
  }

  /**
   * Unsubscribe keydown, keyup event listners for the keys of this keyboard
   */
  unsubscribe() {
    this.leftKey.unsubscribe();
    this.rightKey.unsubscribe();
    this.upKey.unsubscribe();
    this.downKey.unsubscribe();
    this.powerHitKey.unsubscribe();
    this.downRightKey.unsubscribe();
  }
}

/**
 * Class respresenting a key on a keyboard
 * refered: https://github.com/kittykatattack/learningPixi
 */
class Key {
  /**
   * Create a key
   * Refer {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values}
   * @param {string} value KeyboardEvent.code value of this key
   */
  constructor(value) {
    this.value = value;
    this.isDown = false;
    this.isUp = true;

    this.downListener = this.downHandler.bind(this);
    this.upListner = this.upHandler.bind(this);
    this.subscribe();
  }

  /**
   * When key downed
   * @param {KeyboardEvent} event
   */
  downHandler(event) {
    if (event.code === this.value) {
      this.isDown = true;
      this.isUp = false;
      event.preventDefault();
    }
  }

  /**
   * When key upped
   * @param {KeyboardEvent} event
   */
  upHandler(event) {
    if (event.code === this.value) {
      this.isDown = false;
      this.isUp = true;
      event.preventDefault();
    }
  }

  /**
   * Subscribe event listeners
   */
  subscribe() {
    window.addEventListener('keydown', this.downListener);
    window.addEventListener('keyup', this.upListner);
  }

  /**
   * Unsubscribe event listeners
   */
  unsubscribe() {
    window.removeEventListener('keydown', this.downListener);
    window.removeEventListener('keyup', this.upListner);
    this.isDown = false;
    this.isUp = true;
  }
}
