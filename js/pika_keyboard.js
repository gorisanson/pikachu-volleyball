class Key {
  constructor(value) {
    this.value = value;
    this.isDown = false;
    this.isUp = true;

    this.downListener = this.downHandler.bind(this);
    this.upListner = this.upHandler.bind(this);
    window.addEventListener("keydown", this.downListener, false);
    window.addEventListener("keyup", this.upListner, false);
  }

  downHandler(event) {
    if (event.key === this.value) {
      this.isDown = true;
      this.isUp = false;
      event.preventDefault();
    }
  }

  upHandler(event) {
    if (event.key === this.value) {
      this.isDown = false;
      this.isUp = true;
      event.preventDefault();
    }
  }

  // Detach event listeners
  unsubscribe() {
    window.removeEventListener("keydown", this.downListener);
    window.removeEventListener("keyup", this.upListener);
  }
}

class PikaKeyboard {
  // left, right, up, down, powerHit: KeyboardEvent.key value for each
  // refer https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
  constructor(left, right, up, down, powerHit) {
    this.xDirection = 0; // 0: not pressed, -1: left-direction pressed, 1: right-direction pressed
    this.yDirection = 0; // 0: not pressed, -1: up-direction pressed, 1: down-direction pressed
    this.powerHit = 0; // 0: auto-repeated or not pressed, 1: newly pressed
    this.powerHitKeyIsDownPrevious = false;

    this.leftKey = new Key(left);
    this.rightKey = new Key(right);
    this.upKey = new Key(up);
    this.downKey = new Key(down);
    this.powerHitKey = new Key(powerHit);
  }

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

  unsubscribe() {
    this.leftKey.unsubscribe();
    this.rightKey.unsubscribe();
    this.upKey.unsubscribe();
    this.downKey.unsubscribe();
    this.powerHitKey.unsubscribe();
  }
}
