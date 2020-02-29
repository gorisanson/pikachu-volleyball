/*
 *  X width: 432 = 0x1B0
 *  Y width: 304 = 0x130
 *
 *  X position coord right-direction increasing
 *  Y position coord down-direction increasing
 *
 *  Ball radius: 20 = 0x14
 *  Player half-width: 32 = 0x20
 */

// player on left side
const player1 = {
  isPlayer2: false, // 0xA0
  isComputer: false, // 0xA4
  x: 0, // 0xA8
  y: 0, // 0xAC
  yVelocity: 0, // 0xB0

  // state
  // 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving
  // 4: lying_down_after_diving
  // 5: win!, 6: lost..
  state: 0, // 0xC0 
  divingDirection: 0, // 0xB4
  lyingDownDurationLeft: -1, // 0xB8
  isCollisionWithBallHappened: false,  // 0xBC
  frameNumber: 0,  // 0xC4
  normalStatusArmSwingDirection: 1,
  delayBeforeNextFrame: 0, // 0xCC
  isWinner: false, // 0xD0
  gameOver: false  // 0xD4
};

// player on right side
const player2 = {
  isPlayer2: true, // 0xA0
  isComputer: false, // 0xA4
  x: 0, // 0xA8
  y: 0, // 0xAC
  yVelocity: 0, // 0xB0
  
  // state
  // 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving
  // 4: lying_down_after_diving
  // 5: win!, 6: lost..
  state: 0, // 0xC0
  lyingDownDurationLeft: -1, // 0xB8
  isCollisionWithBallHappened: false,  // 0xBC
  frameNumber: 0,  // 0xC4
  normalStatusArmSwingDirection: 1,
  delayBeforeNextFrame: 0, // 0xCC
  isWinner: false, // 0xD0
  gameOver: false  // 0xD4
};

const ball = {
  x: 0, // 0x30
  y: 0, // 0x34
  xVelocity: 0, // 0x38
  yVelocity: 0, // 0x3C
  expectedLandingPointX: 40000, // 0x40
  isPowerHit: false // 0x68
};

const keyboard = {
  xDirection: 0,  // 0: not pressed, -1: left-direction pressed, 1: right-direction pressed
  yDirection: 0,   // 0: not pressed, -1: up-direction pressed, 1: down-direction pressed
  powerHitKeyPressedThisKeyShouldNotAutoRepeated: false
}

function physicsFunction(player1, player2, ball, keyboard) {
  const wasBallTouchedGround = processCollisionBetweenBallAndWorld(p_to_ball);  // p_to_ball: this + 0x14

  let player, theOtherPlayer;
  let local_14 = [0, 0, 0, 0, 0] // array
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
    processPlayerMovement(player, keyboard, theOtherPlayer, ball);
    // TODO: what is this??? two.. functions...
    // TODO: what is this??
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
    const is_happend = isCollisionBetweenBallAndPlayerHappened(ball, player.x, player.y);
    if (is_happend === true) {
      if (player.isCollisionWithBallHappened === false) {
        processCollisionBetweenBallAndPlayer(ball, player.x, keyboard, player.state);
        player.isCollisionWithBallHappened = true;
      }
    } else {
      player.isCollisionWithBallHappened = false;
    }
  }
  // TODO: what Function is this?
  // TODO: what Function is this?
  return wasBallTouchedGround;
}

// FUN_00402dc0
function processCollisionBetweenBallAndWorld(ball) {
  let iVar2 = ball.xVelocity;
  let iVar5 = iVar2 / 2 + ball.x48;
  ball.x48 = iVar5;
  if (iVar5 < 0) {
    iVar5 += 50;
  } else if (iVar5 > 50) {
    iVar5 += -50;
  }
  ball.x48 = iVar5;

  ball.x44 = (ball.x48 / 10) >> 0; // integer division

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
      if (ball_x < 216) {
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
    ball.yVelocity = -ball.yVelocity;
    ball.x50 = ball.x;
    ball.y = 252;
    ball.x4c = 20;
    ball.x54 = 272;
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
function processPlayerMovement(player, keyboard, theOtherPlayer, ball) {
  if (player === null || ball === null) {
    return 0;
  }

  if (player.isComputer === true) {
    // maybe computer ai function?
    FUN_00402460(player, ball, theOtherPlayer, keyboard);
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
    keyboard.yDirection === -1 &&    // up-key downed
    player.y === 244    // player is touching on the ground
  ) {
    player.yVelocity = -16;
    player.state = 1;
    player.frameNumber = 0;
    //TODO: stereo sound function FUN_00408470 (0x90)
    //TODO: sound function "chu~" (0x90 + 0x10)
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

  if (
    keyboard.powerHitKeyPressedThisKeyShouldNotAutoRepeated === true
  ) {
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
    } else if (
      player.state === 0 &&
      keyboard.xDirection !== 0
    ) {
      // then player do diving!
      player.state = 3;
      player.frameNumber = 0;
      player.divingDirection = keyboard.xDirection;
      player.yVelocity = -5;
      //TODO: stereo sound function FUN_00408470 (0x90)
      //TODO: sound function "chu~" (0x90 + 0x10)
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
      player.frameNumber = player.frameNumber + player.normalStatusArmSwingDirection;
    }
  }

  if (player.gameOver === true) {
    if (player.state === 0) {
      if (player.isWinner === true) {
        player.state = 5;
        //TODO: stereo sound function FUN_00408470 (0x98)
        //TODO: sound function "what?" (0x98 + 0x10) "pik~"?
      } else {
        player.state === 6;
      }
      player.delayBeforeNextFrame = 0;
      player.frameNumber = 0;
    }
    FUN_004025e0(player);
  }
  return 1;
}

// FUN_004030a0
function processCollisionBetweenBallAndPlayer(
  ball,
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
    // the original source code use "_rand()" function
    // I could't figure out how this function works exactly.
    // But, anyhow, it should be a funtion that generate a random number.
    ball.xVelocity = Math.floor(3 * Math.random()) - 1;
  }

  const ballAbsVelocityY = Math.abs(ball.yVelocity);
  ball.yVelocity = -ballAbsVelocityY;

  if (ballAbsVelocityY < 15) {
    ball.yVelocity = -15;
  }

  // if power hit key down
  if (playerState === 2) {
    // if player is jumping and power hitting
    // TODO: manymany other
    if (ball.x < 216) {
      ball.xVelocity = (Math.abs(keyboard.xDirection) + 1) * 10;
    } else {
      ball.xVelocity = -(Math.abs(keyboard.xDirection) + 1) * 10;
    }
    ball.x50 = ball.x;
    ball.x54 = ball.y;

    ball.yVelocity = Math.abs(ball.yVelocity) * keyboard.yDirection * 2;
    ball.x4c = 20;
    // TODO: stereo SOUND FUN_00408470 (0x24)
    // TODO: SOUND power hit sound (0x24 + 0x10)
    ball.isPowerHit = true;
  } else {
    ball.isPowerHit = false;
  }

  // TODO: here call function which expect landing point x of ball
  caculate_expected_landing_point_x_for(ball)

  return 1;
}

function FUN_004025e0(player) {
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
function copyBallInfoToArrayAndCalcExpectedX(ball, ball, dest) {
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
        if (ball_x < 216) {
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
