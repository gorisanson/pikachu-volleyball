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
class Player {
  // isPlayer2: boolean, isComputer: boolean
  constructor(isPlayer2, isComputer) {
    this.isPlayer2 = isPlayer2; // 0xA0 // Assumes that player1 play on the left side
    this.isComputer = isComputer; // 0xA4
    this.initialize();

    this.divingDirection = 0; // 0xB4
    this.lyingDownDurationLeft = -1; // 0xB8
    this.isWinner = false; // 0xD0
    this.gameOver = false; // 0xD4
    this.randomNumberZeroOrOne = 0; // 0xDC
  }

  // properties that are initialized per round in here
  initialize() {
    this.x = 36; // 0xA8 // initialized to 36 (player1) or 396 (player2)
    if (this.isPlayer2) {
      this.x = 396;
    }
    this.y = 244; // 0xAC   // initialized to 244
    this.yVelocity = 0; // 0xB0  // initialized to 0
    this.isCollisionWithBallHappened = false; // 0xBC   // initizlized to 0 i.e false

    // state
    // 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving
    // 4: lying_down_after_diving
    // 5: win!, 6: lost..
    this.state = 0; // 0xC0   // initialized to 0
    this.frameNumber = 0; // 0xC4   // initialized to 0
    this.normalStatusArmSwingDirection = 1; // 0xC8  // initialized to 1
    this.delayBeforeNextFrame = 0; // 0xCC  // initizlized to 0
    this.randomNumberForRound = rand() % 5; // 0xD8  // initialized to (_rand() % 5)
  }
}

// Initial Values: refer FUN_000403a90 && FUN_00402d60
class Ball {
  constructor(isPlayer2Serve) {
    this.initialize(isPlayer2Serve);
    this.expectedLandingPointX = 0; // 0x40
    this.rotation = 0; // 0x44 // ball rotation frame selector // one of 0, 1, 2, 3, 4 // if it is other value, hyper ball glitch occur?
    this.fineRotation = 0; // 0x48
    this.punchEffectX = 0; // 0x50 // coordinate X for punch effect
    this.punchEffectY = 0; // 0x54 // coordinate Y for punch effect
    // previous values are for trailing effect for power hit
    this.previousX = 0; // 0x58
    this.previousPreviousX = 0; // 0x5c
    this.previousY = 0; // 0x60
    this.previousPreviousY = 0; // 0x64
  }

  initialize(isPlayer2Serve) {
    this.x = 56; // 0x30    // initialized to 56 or 376
    if (isPlayer2Serve === true) {
      this.x = 376;
    }
    this.y = 0; // 0x34   // initialized to 0
    this.xVelocity = 0; // 0x38  // initialized to 0
    this.yVelocity = 1; // 0x3C  // initialized to 1
    this.punchEffectRadius = 0; // 0x4c // initialized to 0
    this.isPowerHit = false; // 0x68  // initialized to 0 i.e. false
  }
}

class Sound {
  constructor() {
    this.pipikachu = false;
    this.pika = false;
    this.chu = false;
    this.pi = false;
    this.pikachu = false;
    this.powerHit = false;
    this.ballTouchesGround = false;
  }
}

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
  for (let i = 0; i < 2; i++) {
    if (i == 0) {
      player = player1;
      theOtherPlayer = player2;
    } else {
      player = player2;
      theOtherPlayer = player1;
    }

    // FUN_00402d90 ommited
    // FUN_00402810 ommited
    // this javascript code is refactored not to need above two function except for
    // a part of FUN_00402d90:
    // FUN_00402d90 include FUN_004031b0(caculate_expected_landing_point_x_for)
    caculate_expected_landing_point_x_for(ball); // calculate expected_X;

    processPlayerMovementAndSetPlayerPosition(
      player,
      sound,
      keyboardArray[i],
      theOtherPlayer,
      ball
    );

    // FUN_00402830 ommited
    // FUN_00406020 ommited
    // tow function ommited above maybe participates in graphic drawing for a player
  }

  for (let i = 0; i < 2; i++) {
    if (i == 0) {
      player = player1;
    } else {
      player = player2;
    }

    // FUN_00402810 ommited: this javascript code is refactored not to need this function

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

  // FUN_00403040
  // FUN_00406020
  // tow function ommited above maybe participates in graphic drawing for a ball

  return wasBallTouchedGround;
}

// FUN_00402dc0
// "sound" parameter is not in the original machine (assembly) code
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
    // FUN_00408470 omitted
    // the function omitted above receives 100 * (ball.x - 216),
    // i.e. horizontal displacement from net maybe for stereo sound?
    // code function (ballpointer + 0x28 + 0x10)? omitted
    // the omitted two functions maybe do a part of sound playback role.
    sound.ballTouchesGround = true;

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
// "sound" parameter is not in the original machine (assembly) code
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
    // maybe-stereo-sound function FUN_00408470 (0x90) ommited:
    // refer a detailed comment above about this function
    // maybe-sound code function (playerpointer + 0x90 + 0x10)? ommited
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
      player.delayBeforeNextFrame = 5;
      player.frameNumber = 0;
      player.state = 2;
      // maybe-sound function (playerpointer + 0x90 + 0x18)? ommited
      // maybe-stereo-sound function FUN_00408470 (0x90) ommited:
      // refer a detailed comment above about this function
      // maybe-sound function (playerpointer + 0x90 + 0x14)? ommited
      sound.pika = true;
    } else if (player.state === 0 && keyboard.xDirection !== 0) {
      // then player do diving!
      player.state = 3;
      player.frameNumber = 0;
      player.divingDirection = keyboard.xDirection;
      player.yVelocity = -5;
      // maybe-stereo-sound function FUN_00408470 (0x90) ommited:
      // refer a detailed comment above about this function
      // maybe-sound code function (playerpointer + 0x90 + 0x10)? ommited
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
        // maybe-stereo-sound function FUN_00408470 (0x90) ommited:
        // refer a detailed comment above about this function
        // maybe-sound code function (0x98 + 0x10) ommited
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

// FUN_004030a0
// "sound" parameter is not in the original machine (assembly) code.
// "playerY" parameter is in the origianl machine (assembly) code
// but not used in this function.
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
    // The original machine (assembly) code use "_rand()" function in Visual Studio 1988 Libarary.
    // I could't find out how this function works exactly.
    // But, anyhow, it should be a funtion that generate a random number.
    // I decided to use custom rand function which generates random integer from [0, 32767]
    // which follows rand() function in Visual Studio 2017 Library.
    ball.xVelocity = (rand() % 3) - 1;
  }

  const ballAbsYVelocity = Math.abs(ball.yVelocity);
  ball.yVelocity = -ballAbsYVelocity;

  if (ballAbsYVelocity < 15) {
    ball.yVelocity = -15;
  }

  // player is jumping and power hitting
  if (playerState === 2) {
    if (ball.x < 216) {
      ball.xVelocity = (Math.abs(keyboard.xDirection) + 1) * 10;
    } else {
      ball.xVelocity = -(Math.abs(keyboard.xDirection) + 1) * 10;
    }
    ball.punchEffectX = ball.x;
    ball.punchEffectY = ball.y;

    ball.yVelocity = Math.abs(ball.yVelocity) * keyboard.yDirection * 2;
    ball.punchEffectRadius = 20;
    // maybe-stereo-sound function FUN_00408470 (0x90) ommited:
    // refer a detailed comment above about this function
    // maybe-soundcode function (ballpointer + 0x24 + 0x10) ommited:
    sound.powerHit = true;

    ball.isPowerHit = true;
  } else {
    ball.isPowerHit = false;
  }

  caculate_expected_landing_point_x_for(ball);

  return 1;
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
// the AI function
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
      ball.x > left_boundary &&
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
          Math.abs(expectedLandingPointX - theOtherPlayer.x) > 64
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
          Math.abs(expectedLandingPointX - theOtherPlayer.x) > 64
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
      /*
        TODO: is it real??
        it's just same as
        
        if (copyBall.yVelocity > 0) {
          copyBall.yVelocity = -copyBall.yVelocity;
        }
        
        maybe this is mistake of the original author....

        Or is it for making AI doing mistakes??
      */
      if (copyBall.y < 193) {
        if (copyBall.yVelocity > 0) {
          copyBall.yVelocity = -copyBall.yVelocity;
        }
      } else if (copyBall.yVelocity > 0) {
        copyBall.yVelocity = -copyBall.yVelocity;
      }

      // The one for AI not doing those mistakes is as below.

      // if (copyBall.y < 193) {
      //   if (copyBall.yVelocity > 0) {
      //     copyBall.yVelocity = -copyBall.yVelocity;
      //   }
      // } else {
      //   if (copyBall.x < 216) {
      //     copyBall.xVelocity = -Math.abs(copyBall.xVelocity);
      //   } else {
      //     copyBall.xVelocity = Math.abs(copyBall.xVelocity);
      //   }
      // }
    }
    copyBall.y = copyBall.y + copyBall.yVelocity;
    if (copyBall.y > 252) {
      return copyBall.x;
    }
    copyBall.x = copyBall.x + copyBall.xVelocity;
    copyBall.yVelocity += 1;
  }
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
