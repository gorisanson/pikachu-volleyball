/*
 *  X width: 432 = 0x1B0
 *  Y width: 304 = 0x130
 *
 *  X position coord right-direction increasing
 *  Y position coord down-direction increasing
 *
 *  Ball radius: 20 = 0x14
 *  Ball diameter: 40 = 0x28
 *
 *  Player half-width: 32 = 0x20
 *  Player half-height: 32 = 0x20
 *  Player width: 64 = 0x40
 *  Player height: 64 = 0x40
 *
 *  Game speed:
 *    slow: 1 frame per 33ms = 30.303030...Hz
 *    medium: 1 frame per 40ms = 25Hz
 *    fast: 1 frame per 50ms = 20Hz
 */

// Initial Values: refer FUN_000403a90 && FUN_00401f40
// player on left side
let player1 = {
  isPlayer2: false, // 0xA0
  isComputer: true, // 0xA4
  x: 36, // 0xA8    // initialized to 36 (player1) or 396 (player2)
  y: 244, // 0xAC   // initialized to 244
  yVelocity: 0, // 0xB0  // initialized to 0
  divingDirection: 0, // 0xB4
  lyingDownDurationLeft: -1, // 0xB8
  isCollisionWithBallHappened: false, // 0xBC   // initizlized to 0 i.e false
  // state
  // 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving
  // 4: lying_down_after_diving
  // 5: win!, 6: lost..
  state: 0, // 0xC0   // initialized to 0
  frameNumber: 0, // 0xC4   // initialized to 0
  normalStatusArmSwingDirection: 1, // 0xC8  // initialized to 1
  delayBeforeNextFrame: 0, // 0xCC  // initizlized to 0
  isWinner: false, // 0xD0
  gameOver: false, // 0xD4
  randomNumberForRound: rand() % 5, // 0xD8  // initialized to (_rand() % 5)
  randomNumberZeroOrOne: 0 // 0xDC
};

// player on right side
let player2 = {
  isPlayer2: true, // 0xA0
  isComputer: true, // 0xA4
  x: 396, // 0xA8
  y: 244, // 0xAC
  yVelocity: 0, // 0xB0
  divingDirection: 0, // 0xB4
  lyingDownDurationLeft: -1, // 0xB8
  isCollisionWithBallHappened: false, // 0xBC
  // state
  // 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving
  // 4: lying_down_after_diving
  // 5: win!, 6: lost..
  state: 0, // 0xC0
  frameNumber: 0, // 0xC4
  normalStatusArmSwingDirection: 1, // 0xC8
  delayBeforeNextFrame: 0, // 0xCC
  isWinner: false, // 0xD0
  gameOver: false, // 0xD4
  randomNumberForRound: rand() % 5, // 0xD8  // random number for random control of the AI (determined per round)
  randomNumberZeroOrOne: 0 // 0xDC  // random number for random contrl of the AI
};

// Initial Values: refer FUN_000403a90 && FUN_00402d60
let ball = {
  x: 56, // 0x30    // initialized to 56 or 376
  y: 0, // 0x34   // initialized to 0
  xVelocity: 0, // 0x38  // initialized to 0
  yVelocity: 1, // 0x3C  // initialized to 1
  expectedLandingPointX: 0, // 0x40
  rotation: 0, // 0x44 // ball rotation frame selector // one of 0, 1, 2, 3, 4 // if it is other value, hyper ball glitch occur?
  fineRotation: 0, // 0x48
  punchEffectRadius: 0, // 0x4c // initialized to 0
  punchEffectX: 0, // 0x50 // coordinate X for punch effect
  punchEffectY: 0, // 0x54 // coordinate Y for punch effect
  // previous values are for trailing effect for power hit
  previousX: 0, // 0x58
  previousPreviousX: 0, // 0x5c
  previousY: 0, // 0x60
  previousPreviousY: 0, // 0x64
  isPowerHit: false // 0x68  // initialized to 0 i.e. false
};

let sound = {
  pipikachu: false,
  pika: false,
  chu: false,
  pi: false,
  pikachu: false,
  powerHit: false,
  ballTouchesGround: false
};

const keyboard = {
  xDirection: 0, // 0: not pressed, -1: left-direction pressed, 1: right-direction pressed
  yDirection: 0, // 0: not pressed, -1: up-direction pressed, 1: down-direction pressed
  powerHit: 0 // 0: auto-repeated or not pressed, 1: newly pressed
};

function rand() {
  return Math.floor(32768 * Math.random());
}

// FUN_00403dd0
function physicsEngine(player1, player2, ball, sound, keyboardArray) {
  const wasBallTouchedGround = processCollisionBetweenBallAndWorldAndSetBallPosition(
    ball,
    sound
  );

  let player, theOtherPlayer;
  let local_14 = [0, 0, 0, 0, 0]; // array
  let local_lc = [0, 0]; // array
  let local_38 = [0, 0];

  for (let i = 0; i < 2; i++) {
    if (i == 0) {
      player = player1;
      theOtherPlayer = player2;
    } else {
      player = player2;
      theOtherPlayer = player1;
    }
    // TODO: clean up... and don't forget to include calc_expected_x!
    //FUN_00402d90
    copyBallInfoToArrayAndCalcExpectedX(ball, local_14);
    //FUN_00402810
    copyPlayerInfoToArray(theOtherPlayer, local_lc);
    //FUN_00401fc0
    processPlayerMovementAndSetPlayerPosition(
      player,
      sound,
      keyboardArray[i],
      theOtherPlayer,
      ball
    );
    // TODO: what is this??? two.. functions...
    // TODO: what is this??
    // maybe graphic function!
    // draw(player.x - 32, player.y - 32, 64, 64)
  }

  for (let i = 0; i < 2; i++) {
    if (i == 0) {
      player = player1;
    } else {
      player = player2;
    }
    // TODO: clean up
    //FUN_00402810
    copyPlayerInfoToArray(player, local_38);
    const is_happend = isCollisionBetweenBallAndPlayerHappened(
      ball,
      player.x,
      player.y
    );
    if (is_happend === true) {
      if (player.isCollisionWithBallHappened === false) {
        processCollisionBetweenBallAndPlayer(
          ball,
          sound,
          player.x,
          keyboardArray[i],
          player.state
        );
        player.isCollisionWithBallHappened = true;
      }
    } else {
      player.isCollisionWithBallHappened = false;
    }
  }
  // TODO: what Function is this?
  // TODO: what Function is this?
  // maybe graphic funcation
  // draw(ball.x - 20, ball.y- 20, 20, 20)
  return wasBallTouchedGround;
}

// FUN_00402dc0
function processCollisionBetweenBallAndWorldAndSetBallPosition(ball, sound) {
  let futureFineRotation = ball.fineRotation + ball.xVelocity / 2;
  // If futureFineRotation === 50, it skips next if statement finely.
  // Then ball.fineRoation = 50, and then ball.rotation = 5 (which designates hyperball sprite!).
  // In this way, hyper ball glitch occur!
  // If this happen at the end of round,
  // since ball.xVeloicy is 0-initailized at each start of round,
  // hyper ball sprite is rendered continuously until a collision happens.
  if (futureFineRotation < 0) {
    futureFineRotation += 50;
  } else if (futureFineRotation > 50) {
    futureFineRotation += -50;
  }
  ball.fineRotation = futureFineRotation;
  ball.rotation = (ball.fineRotation / 10) >> 0; // integer division

  const futureBallX = ball.x + ball.xVelocity;
  // If the center of ball would get out of left world bound or right world bound
  //
  // TODO:
  // futureBallX > 432 should be changed to futureBallX > (432 - 20)
  // [maybe upper one is more possible when seeing pikachu player's x-direction boundary]
  // or, futureBallX < 20 should be changed to futureBallX < 0
  // I think this is a mistake of the author of the original game.
  if (futureBallX < 20 || futureBallX > 432) {
    ball.xVelocity = -ball.xVelocity;
  }

  let futureBallY = ball.y + ball.yVelocity;
  // if the center of ball would get out of upper world bound
  if (futureBallY < 0) {
    ball.yVelocity = 1;
  }

  // If ball touches net
  if (Math.abs(ball.x - 216) < 25 && ball.y > 176) {
    if (ball.y < 193) {
      if (ball.yVelocity > 0) {
        ball.yVelocity = -ball.yVelocity;
      }
    } else {
      if (ball.x < 216) {
        ball.xVelocity = -Math.abs(ball.xVelocity);
      } else {
        ball.xVelocity = Math.abs(ball.xVelocity);
      }
    }
  }

  futureBallY = ball.y + ball.yVelocity;
  // if ball would touch ground
  if (futureBallY > 252) {
    //TODO: FUN_00408470 stereo SOUND (0x28)
    //TODO: SOUND function : ball touch ground sound (0x28 + 0x10)
    sound.touchesGround = true;
    ball.yVelocity = -ball.yVelocity;
    ball.punchEffectX = ball.x;
    ball.y = 252;
    ball.punchEffectRadius = 20;
    ball.punchEffectY = 272;
    return 1;
  }
  ball.y = futureBallY;
  ball.x = ball.x + ball.xVelocity;
  ball.yVelocity += 1;

  return 0;
}

// FUN_00401fc0
// param1_array maybe keyboard (if param_1[1] === -1, up_key downed)
// param1[0] === -1: left key downed, param1[0] === 1: right key downed.
// param1[0] === 0: left/right key not downed.
function processPlayerMovementAndSetPlayerPosition(
  player,
  sound,
  keyboard,
  theOtherPlayer,
  ball
) {
  if (player === null || ball === null) {
    return 0;
  }

  if (player.isComputer === true) {
    // maybe computer ai function?
    letComputerDecideKeyboardPress(player, ball, theOtherPlayer, keyboard);
  }

  // if player is lying down..
  if (player.state === 4) {
    player.lyingDownDurationLeft += -1;
    if (player.lyingDownDurationLeft < -1) {
      player.state = 0;
    }
    return 1;
  }

  // process x-direction movement
  let playerVelocityX = 0;
  if (player.state < 5) {
    if (player.state < 3) {
      playerVelocityX = keyboard.xDirection * 6;
    } else {
      // if player is diving..
      playerVelocityX = player.divingDirection * 8;
    }
  }

  let futurePlayerX = player.x + playerVelocityX;
  player.x = futurePlayerX;

  // process player's x-direction world boundary
  if (player.isPlayer2 === false) {
    // if player is player1
    if (futurePlayerX < 32) {
      player.x = 32;
    } else if (futurePlayerX > 216 - 32) {
      player.x = 216 - 32;
    }
  } else {
    // if player is player2
    if (futurePlayerX < 216 + 32) {
      player.x = 216 + 32;
    } else if (futurePlayerX > 432 - 32) {
      player.x = 432 - 32;
    }
  }

  // jump
  if (
    player.state < 3 &&
    keyboard.yDirection === -1 && // up-key downed
    player.y === 244 // player is touching on the ground
  ) {
    player.yVelocity = -16;
    player.state = 1;
    player.frameNumber = 0;
    //TODO: stereo sound function FUN_00408470 (0x90)
    //TODO: sound function "chu~" (0x90 + 0x10)
    sound.chu = true;
  }

  // gravity
  let futurePlayerY = player.y + player.yVelocity;
  player.y = futurePlayerY;
  if (futurePlayerY < 244) {
    player.yVelocity += 1;
  } else if (futurePlayerY > 244) {
    // if player is landing..
    player.yVelocity = 0;
    player.y = 244;
    player.frameNumber = 0;
    if (player.state === 3) {
      // if player is diving..
      player.state = 4;
      player.frameNumber = 0;
      player.lyingDownDurationLeft = 3;
    } else {
      player.state = 0;
    }
  }

  if (keyboard.powerHit === 1) {
    if (player.state === 1) {
      // if player is jumping..
      // then player do power hit!
      iVar3 = player.x;
      player.delayBeforeNextFrame = 5;
      player.frameNumber = 0;
      player.state = 2;
      //TODO: sound function "pik~" (0x90 + 0x18)
      //TODO: stereo sound function FUN_00408470 (0x94)
      //TODO: sound function "ika!" (0x90 + 0x14)
      sound.pika = true;
    } else if (player.state === 0 && keyboard.xDirection !== 0) {
      // then player do diving!
      player.state = 3;
      player.frameNumber = 0;
      player.divingDirection = keyboard.xDirection;
      player.yVelocity = -5;
      //TODO: stereo sound function FUN_00408470 (0x90)
      //TODO: sound function "chu~" (0x90 + 0x10)
      sound.chu = true;
    }
  }

  if (player.state === 1) {
    player.frameNumber = (player.frameNumber + 1) % 3;
  } else if (player.state === 2) {
    if (player.delayBeforeNextFrame < 1) {
      player.frameNumber += 1;
      if (player.frameNumber > 4) {
        player.frameNumber = 0;
        player.state = 1;
      }
    } else {
      player.delayBeforeNextFrame -= 1;
    }
  } else if (player.state === 0) {
    player.delayBeforeNextFrame += 1;
    if (player.delayBeforeNextFrame > 3) {
      player.delayBeforeNextFrame = 0;
      temp = player.frameNumber + player.normalStatusArmSwingDirection;
      if (temp < 0 || temp > 4) {
        player.normalStatusArmSwingDirection = -player.normalStatusArmSwingDirection;
      }
      player.frameNumber =
        player.frameNumber + player.normalStatusArmSwingDirection;
    }
  }

  if (player.gameOver === true) {
    if (player.state === 0) {
      if (player.isWinner === true) {
        player.state = 5;
        //TODO: stereo sound function FUN_00408470 (0x98)
        //TODO: sound function "what?" (0x98 + 0x10) "pik~"?
        sound.pipikachu = true;
      } else {
        player.state === 6;
      }
      player.delayBeforeNextFrame = 0;
      player.frameNumber = 0;
    }
    processGameOverFrameFor(player);
  }
  return 1;
}

// FUN_004030a0
function processCollisionBetweenBallAndPlayer(
  ball,
  sound,
  playerX,
  keyboard,
  playerState
) {
  // playerX is maybe pika's x position
  // if collision occur,
  // greater the x position difference between pika and ball,
  // greater the x velocity of the ball.
  if (ball.x < playerX) {
    // Since javascript division is float division by default
    // I use "Math.floor" to do integer division
    ball.xVelocity = -Math.floor(Math.abs(ball.x - playerX) / 3);
  } else if (ball.x > playerX) {
    ball.xVelocity = Math.floor(Math.abs(ball.x - playerX) / 3);
  }

  // If ball velocity x is 0, randomly choose one of -1, 0, 1.
  if (ball.xVelocity === 0) {
    // The original source code use "_rand()" function in Visual Studio 1988 Libarary.
    // I could't find out how this function works exactly.
    // But, anyhow, it should be a funtion that generate a random number.
    // I decided to use custom rand function which generates random integer from [0, 32767]
    // which follows rand() function in Visual Studio 2017 Library.
    ball.xVelocity = (rand() % 3) - 1;
  }

  const ballAbsVelocityY = Math.abs(ball.yVelocity);
  ball.yVelocity = -ballAbsVelocityY;

  if (ballAbsVelocityY < 15) {
    ball.yVelocity = -15;
  }

  // player is jumping and power hitting
  if (playerState === 2) {
    // if player is jumping and power hitting
    // TODO: manymany other
    if (ball.x < 216) {
      ball.xVelocity = (Math.abs(keyboard.xDirection) + 1) * 10;
    } else {
      ball.xVelocity = -(Math.abs(keyboard.xDirection) + 1) * 10;
    }
    ball.punchEffectX = ball.x;
    ball.punchEffectY = ball.y;

    ball.yVelocity = Math.abs(ball.yVelocity) * keyboard.yDirection * 2;
    ball.punchEffectRadius = 20;
    // TODO: stereo SOUND FUN_00408470 (0x24)
    // TODO: SOUND power hit sound (0x24 + 0x10)
    sound.powerHit = true;

    ball.isPowerHit = true;
  } else {
    ball.isPowerHit = false;
  }

  // TODO: here call function which expect landing point x of ball
  caculate_expected_landing_point_x_for(ball);

  return 1;
}

// FUN_004025e0
function processGameOverFrameFor(player) {
  if (player.gameOver === true && player.frameNumber < 4) {
    player.delayBeforeNextFrame += 1;
    if (player.delayBeforeNextFrame > 4) {
      player.delayBeforeNextFrame = 0;
      player.frameNumber += 1;
    }
    return 1;
  }
  return 0;
}

// FUN_00402d90
function copyBallInfoToArrayAndCalcExpectedX(ball, dest) {
  dest[0] = ball.x;
  dest[1] = ball.y;
  dest[2] = ball.xVelocity;
  dest[3] = ball.yVelocity;
  dest[4] = ball.expectedLandingPointX;
  // TODO: can I extract this FUN below??
  caculate_expected_landing_point_x_for(ball); // calculate expected_X;
}

//FUN_00402810
function copyPlayerInfoToArray(player, dest) {
  dest[0] = player.x;
  dest[1] = player.y;
}

//FUN_00403070
function isCollisionBetweenBallAndPlayerHappened(ball, playerX, playerY) {
  let diff = ball.x - playerX;
  if (Math.abs(diff) < 33) {
    diff = ball.y - playerY;
    if (Math.abs(diff) < 33) {
      return true;
    }
  }
  return false;
}

// FUN_004031b0
function caculate_expected_landing_point_x_for(ball) {
  const copyBall = {
    x: ball.x,
    y: ball.y,
    xVelocity: ball.xVelocity,
    yVelocity: ball.yVelocity
  };
  while (true) {
    const futureCopyBallX = copyBall.xVelocity + copyBall.x;
    if (futureCopyBallX < 20 || futureCopyBallX > 432) {
      copyBall.xVelocity = -copyBall.xVelocity;
    }
    if (copyBall.y + copyBall.yVelocity < 0) {
      copyBall.yVelocity = 1;
    }

    // If copy ball touches net
    if (Math.abs(copyBall.x - 216) < 25 && copyBall.y > 176) {
      // TODO: it maybe should be 193 as in process_collision_with_ball_and_world function
      // original author's mistake?
      if (copyBall.y < 192) {
        if (copyBall.yVelocity > 0) {
          copyBall.yVelocity = -copyBall.yVelocity;
        }
      } else {
        if (copyBall.x < 216) {
          copyBall.xVelocity = -Math.abs(copyBall.xVelocity);
        } else {
          copyBall.xVelocity = Math.abs(copyBall.xVelocity);
        }
      }
    }

    copyBall.y = copyBall.y + copyBall.yVelocity;
    // if copyBall would touch ground
    if (copyBall.y > 252) {
      break;
    }
    copyBall.x = copyBall.x + copyBall.xVelocity;
    copyBall.yVelocity += 1;
  }
  ball.expectedLandingPointX = copyBall.x;
  return 1;
}

// TODO: Math.abs(ball.x - player.x) appears too many.. refactor!
// FUN_00402360
function letComputerDecideKeyboardPress(
  player,
  ball,
  theOtherPlayer,
  keyboard
) {
  keyboard.xDirection = 0;
  keyboard.yDirection = 0;
  keyboard.powerHit = 0;
  // TODO what is 4th property?? of keyboard??

  let virtualExpectedLandingPointX = ball.expectedLandingPointX;
  if (
    Math.abs(ball.x - player.x) > 100 &&
    Math.abs(ball.xVelocity) < player.randomNumberForRound + 5
  ) {
    let temp = player.isPlayer2 * 216;
    if (
      (ball.expectedLandingPointX <= temp ||
        ball.expectedLandingPointX >= player.isPlayer2 * 432 + 216) &&
      player.randomNumberZeroOrOne === 0
    ) {
      temp += 108;
      virtualExpectedLandingPointX = temp;
    }
  }

  if (
    Math.abs(virtualExpectedLandingPointX - player.x) >
    player.randomNumberForRound + 8
  ) {
    if (player.x < virtualExpectedLandingPointX) {
      keyboard.xDirection = 1;
    } else {
      keyboard.xDirection = -1;
    }
  } else if (rand() % 20 === 0) {
    player.randomNumberZeroOrOne = rand() % 2;
  }

  if (player.state === 0) {
    if (
      Math.abs(ball.xVelocity) < player.randomNumberForRound + 3 &&
      Math.abs(ball.x - player.x) < 32 &&
      ball.y > -36 &&
      ball.y < 10 * player.randomNumberForRound + 84 &&
      ball.yVelocity > 0
    ) {
      keyboard.yDirection = -1;
    }

    const left_boundary = player.isPlayer2 * 216;
    const right_boundary = (player.isPlayer2 + 1) * 216;
    if (
      ball.expectedLandingPointX > left_boundary &&
      ball.expectedLandingPointX < right_boundary &&
      Math.abs(ball.x - player.x) > player.randomNumberForRound * 5 + 64 &&
      ball.expectedLandingPointX < ball.x &&
      ball.x < right_boundary &&
      ball.y > 174
    ) {
      keyboard.powerHit = 1;
      if (player.x < ball.x) {
        keyboard.xDirection = 1;
      } else {
        keyboard.xDirection = -1;
      }
    }
  } else if (player.state === 1 || player.state === 2) {
    if (Math.abs(ball.x - player.x) > 8) {
      if (player.x < ball.x) {
        keyboard.xDirection = 1;
      } else {
        keyboard.xDirection = -1;
      }
    }
    if (Math.abs(ball.x - player.x) < 48 && Math.abs(ball.y - player.y) < 48) {
      const willPressPowerHitKey = decideWhetherPressPowerHitKey(
        player,
        ball,
        theOtherPlayer,
        keyboard
      );
      if (willPressPowerHitKey === 1) {
        keyboard.powerHit = 1;
        if (
          Math.abs(theOtherPlayer.x - player.x) < 80 &&
          keyboard.yDirection !== -1
        ) {
          keyboard.yDirection = -1;
        }
      }
    }
  }
}

// FUN_00402630
// return 1 : do power hit
// return 0 : don't do power hit
// this function also do keyboard key setting,
// so that decide also the direction of power hit
function decideWhetherPressPowerHitKey(player, ball, theOtherPlayer, keyboard) {
  if (rand() % 2 === 0) {
    for (let xDirection = 1; xDirection > -1; xDirection--) {
      for (let yDirection = -1; yDirection < 2; yDirection++) {
        const expectedLandingPointX = expectedLandingPointXWhenPowerHit(
          xDirection,
          yDirection,
          ball
        );
        if (
          (expectedLandingPointX <= player.isPlayer2 * 216 ||
            expectedLandingPointX >= player.isPlayer2 * 432 + 216) &&
          Math.abs(expectedLandingPointX, theOtherPlayer.x) > 64
        ) {
          keyboard.xDirection = xDirection;
          keyboard.yDirection = yDirection;
          return 1;
        }
      }
    }
  } else {
    for (let xDirection = 1; xDirection > -1; xDirection--) {
      for (let yDirection = 1; yDirection > -2; yDirection--) {
        const expectedLandingPointX = expectedLandingPointXWhenPowerHit(
          xDirection,
          yDirection,
          ball
        );
        if (
          (expectedLandingPointX <= player.isPlayer2 * 216 ||
            expectedLandingPointX >= player.isPlayer2 * 432 + 216) &&
          Math.abs(expectedLandingPointX, theOtherPlayer.x) > 64
        ) {
          keyboard.xDirection = xDirection;
          keyboard.yDirection = yDirection;
          return 1;
        }
      }
    }
  }
  return 0;
}

// FUN_00402870
function expectedLandingPointXWhenPowerHit(
  keyboardXDirection,
  keyboardYDirection,
  ball
) {
  const copyBall = {
    x: ball.x,
    y: ball.y,
    xVelocity: ball.xVelocity,
    yVelocity: ball.yVelocity
  };
  if (copyBall.x < 216) {
    copyBall.xVelocity = (Math.abs(keyboardXDirection) + 1) * 10;
  } else {
    copyBall.xVelocity = -(Math.abs(keyboardXDirection) + 1) * 10;
  }
  copyBall.yVelocity = Math.abs(copyBall.yVelocity) * keyboardYDirection * 2;

  while (true) {
    const futureCopyBallX = copyBall.x + copyBall.xVelocity;
    if (futureCopyBallX < 20 || futureCopyBallX > 432) {
      copyBall.xVelocity = -copyBall.xVelocity;
    }
    if (copyBall.y + copyBall.yVelocity < 0) {
      copyBall.yVelocity = 1;
    }
    if (Math.abs(copyBall.x - 216) < 25 && copyBall.y > 176) {
      // TODO: is it real??
      // it's just same as
      //
      // if (copyBall.yVelocity > 0) {
      //    copyBall.yVelocity = -copyBall.yVelocity;
      // }
      //
      // maybe this is mistake of the original author....
      //
      if (copyBall.y < 193) {
        if (copyBall.yVelocity > 0) {
          copyBall.yVelocity = -copyBall.yVelocity;
        }
      } else if (copyBall.yVelocity > 0) {
        copyBall.yVelocity = -copyBall.yVelocity;
      }
    }
    copyBall.y = copyBall.y + copyBall.yVelocity;
    if (copyBall.y > 252) {
      return copyBall.x;
    }
    copyBall.x = copyBall.x + copyBall.xVelocity;
    copyBall.yVelocity += 1;
  }
}
