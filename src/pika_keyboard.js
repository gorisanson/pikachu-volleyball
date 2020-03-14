'use strict';
import { PikaUserInput } from './pika_physics.js';

/**
 * Class representing a keyboard used to contorl a player
 */
export class PikaKeyboard extends PikaUserInput {
  /**
   * Create a keyboard used for game controller
   * left, right, up, down, powerHit: KeyboardEvent.key value for each
   * Refer {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values}
   * @param {string} left KeyboardEvent.key value of the key to use for left
   * @param {string} right KeyboardEvent.key value of the key to use for right
   * @param {string} up KeyboardEvent.key value of the key to use for up
   * @param {string} down KeyboardEvent.key value of the key to use for down
   * @param {string} powerHit KeyboardEvent.key value of the key to use for power hit or selection
   */
  constructor(left, right, up, down, powerHit) {
    super();

    /** @private @type {boolean} */
    this.powerHitKeyIsDownPrevious = false;

    /** @private @type {Key} */
    this.leftKey = new Key(left);
    /** @private @type {Key} */
    this.rightKey = new Key(right);
    /** @private @type {Key} */
    this.upKey = new Key(up);
    /** @private @type {Key} */
    this.downKey = new Key(down);
    /** @private @type {Key} */
    this.powerHitKey = new Key(powerHit);
  }

  /**
   * Update xDirection, yDirection, powerHit property of the keyboard.
   * This method is for freezing the keyboard input during the process of one game frame.
   */
  updateProperties() {
    if (this.leftKey.isDown) {
      this.xDirection = -1;
    } else if (this.rightKey.isDown) {
      this.xDirection = 1;
    } else {
      this.xDirection = 0;
    }

    if (this.upKey.isDown) {
      this.yDirection = -1;
    } else if (this.downKey.isDown) {
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
   * Unsubscribe keydown, keyup event listners for the keys of this keyboard
   */
  unsubscribe() {
    this.leftKey.unsubscribe();
    this.rightKey.unsubscribe();
    this.upKey.unsubscribe();
    this.downKey.unsubscribe();
    this.powerHitKey.unsubscribe();
  }
}

/**
 * Class respresenting a key on a keyboard
 */
class Key {
  /**
   * Create a key
   * Refer {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values}
   * @param {string} value KeyboardEvent.key value of this key
   */
  constructor(value) {
    this.value = value;
    this.isDown = false;
    this.isUp = true;

    this.downListener = this.downHandler.bind(this);
    this.upListner = this.upHandler.bind(this);
    window.addEventListener('keydown', this.downListener, false);
    window.addEventListener('keyup', this.upListner, false);
  }

  /**
   * When key downed
   * @param {KeyboardEvent} event
   */
  downHandler(event) {
    if (event.key === this.value) {
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
    if (event.key === this.value) {
      this.isDown = false;
      this.isUp = true;
      event.preventDefault();
    }
  }

  /**
   * Unsubscribe event listeners
   */
  unsubscribe() {
    window.removeEventListener('keydown', this.downListener);
    window.removeEventListener('keyup', this.upListner);
  }
}
