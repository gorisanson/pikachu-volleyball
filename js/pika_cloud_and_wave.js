class Cloud {
  constructor() {
    this.topLeftPointX = -68 + (rand() % (432 + 68));
    this.topLeftPointY = rand() % 152;
    this.topLeftPointXVelocity = 1 + (rand() % 2);
    this.sizeDiffTurnNumber = rand() % 11;
  }

  get sizeDiff() {
    // this same as return [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0][this.sizeDiffTurnNumber]
    return 5 - Math.abs(this.sizeDiffTurnNumber - 5);
  }

  get spriteTopLeftPointX() {
    return this.topLeftPointX - this.sizeDiff;
  }

  get spriteTopLeftPointY() {
    return this.topLeftPointY - this.sizeDiff;
  }

  get spriteWidth() {
    return 48 + 2 * this.sizeDiff;
  }

  get spriteHeight() {
    return 24 + 2 * this.sizeDiff;
  }
}

class Wave {
  constructor() {
    this.verticalCoord = 0;
    this.verticalCoordVelocity = 2;
    this.yCoords = [];
    for (let i = 0; i < 432 / 16; i++) {
      this.yCoords.push(314);
    }
  }
}

// FUN_00404770
function cloudAndWaveEngine(cloudArray, wave) {
  // local_2c = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0];

  // code funtion what is it??
  // FUN_00406080 what is it?

  // ppiVar7 = param_1 + 0x2f
  // *pipiVar7 or pipiVar7[0] : cloud size array index
  // pipiVar7[-0x1e] : cloud topLeftPointX poisition
  // pipiVar7[-10] : cloud topLeftPointX velocity
  // pipiVar7[-0x14]: cloud topLeftPointY position

  for (let i = 0; i < 10; i++) {
    cloudArray[i].topLeftPointX += cloudArray[i].topLeftPointXVelocity;
    if (cloudArray[i].topLeftPointX > 432) {
      cloudArray[i].topLeftPointX = -68;
      cloudArray[i].topLeftPointY = rand() % 152;
      cloudArray[i].topLeftPointXVelocity = 1 + (rand() % 2);
    }
    cloudArray[i].sizeDiffTurnNumber =
      (cloudArray[i].sizeDiffTurnNumber + 1) % 11;
    // SetRect(cloudArray[i].topLeftPointX - sizeDiff, cloudArray[i].topLeftPointY - sizeDiff, 48 + 2*sizeDiff, 24 + 2*sizeDiff);
    // FUN_00406020 maybe graphic function
    // FUN_0049690 what is it?? pixel pisition check?
  }

  // param_1[0x39]: wave.verticalCoord
  // param_1[0x3a]: wave.verticalCoordVelocity

  wave.verticalCoord += wave.verticalCoordVelocity;
  if (wave.verticalCoord > 32) {
    wave.verticalCoord = 32;
    wave.verticalCoordVelocity = -1;
  } else if (wave.verticalCoord < 0 && wave.verticalCoordVelocity < 0) {
    wave.verticalCoordVelocity = 2;
    wave.verticalCoord = -(rand() % 40);
  }

  for (let i = 0; i < 432 / 16; i++) {
    wave.yCoords[i] = 314 - wave.verticalCoord + (rand() % 3);
    // FUN_00406020 maybe grphic function
    // FUN_00409480 what is this function?? pixel pisition check, too??
  }
  return 1;
}
