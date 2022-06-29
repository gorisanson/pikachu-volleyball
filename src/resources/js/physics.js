/**
 * The Model part in the MVC pattern
 *
 * It is the core module which acts as a physics engine.
 * This physics engine calculates the movements of the ball and the players (Pikachus).
 *
 * It is gained by reverse engineering the original game.
 * The address of each function in the original machine code is specified at the comment above each function.
 * ex) FUN_00403dd0 means the original function at the address 00403dd0.
 *
 *
 * ** Some useful infos below **
 *
 *  Ground width: 432 = 0x1B0
 *  Ground height: 304 = 0x130
 *
 *  X position coordinate: [0, 432], right-direction increasing
 *  Y position coordinate: [0, 304], down-direction increasing
 *
 *  Ball radius: 20 = 0x14
 *  Ball diameter: 40 = 0x28
 *
 *  Player half-width: 32 = 0x20
 *  Player half-height: 32 = 0x20
 *  Player width: 64 = 0x40
 *  Player height: 64 = 0x40
 *
 */
'use strict';
import { rand } from './rand.js';
import {
  serveMode,
  SkillTypeForPlayer2Available,
  SkillTypeForPlayer1Available,
} from './ui.js';

/** @constant @type {number} ground width */
const GROUND_WIDTH = 432;
/** @constant @type {number} ground half-width, it is also the net pillar x coordinate */
export const GROUND_HALF_WIDTH = (GROUND_WIDTH / 2) | 0; // integer division
/** @constant @type {number} player (Pikachu) length: width = height = 64 */
const PLAYER_LENGTH = 64;
/** @constant @type {number} player half length */
const PLAYER_HALF_LENGTH = (PLAYER_LENGTH / 2) | 0; // integer division
/** @constant @type {number} player's y coordinate when they are touching ground */
const PLAYER_TOUCHING_GROUND_Y_COORD = 244;
/** @constant @type {number} ball's radius */
const BALL_RADIUS = 20;
/** @constant @type {number} ball's y coordinate when it is touching ground */
const BALL_TOUCHING_GROUND_Y_COORD = 252;
/** @constant @type {number} net pillar's half width (this value is on this physics engine only, not on the sprite pixel size) */
const NET_PILLAR_HALF_WIDTH = 25;
/** @constant @type {number} net pillar top's top side y coordinate */
const NET_PILLAR_TOP_TOP_Y_COORD = 176;
/** @constant @type {number} net pillar top's bottom side y coordinate (this value is on this physics engine only) */
const NET_PILLAR_TOP_BOTTOM_Y_COORD = 192;

/**
 * It's for to limit the looping number of the infinite loops.
 * This constant is not in the original machine code. (The original machine code does not limit the looping number.)
 *
 * In the original ball x coord range setting (ball x coord in [20, 432]), the infinite loops in
 * {@link calculateExpectedLandingPointXFor} function and {@link expectedLandingPointXWhenPowerHit} function seems to be always terminated soon.
 * But if the ball x coord range is edited, for example, to [20, 432 - 20] for left-right symmetry,
 * it is observed that the infinite loop in {@link expectedLandingPointXWhenPowerHit} does not terminate.
 * So for safety, this infinite loop limit is included for the infinite loops mentioned above.
 * @constant @type {number}
 */
const INFINITE_LOOP_LIMIT = 1000;

/**
 * Class representing a pack of physical objects i.e. players and ball
 * whose physical values are calculated and set by {@link physicsEngine} function
 */
export class PikaPhysics {
  /**
   * Create a physics pack
   * @param {boolean} isPlayer1Computer Is player on the left (player 1) controlled by computer?
   * @param {boolean} isPlayer2Computer Is player on the right (player 2) controlled by computer?
   */
  constructor(isPlayer1Computer, isPlayer2Computer) {
    this.player1 = new Player(false, isPlayer1Computer);
    this.player2 = new Player(true, isPlayer2Computer);
    this.ball = new Ball(false);
  }

  /**
   * run {@link physicsEngine} function with this physics object and user input
   *
   * @param {PikaUserInput[]} userInputArray userInputArray[0]: PikaUserInput object for player 1, userInputArray[1]: PikaUserInput object for player 2
   * @return {boolean} Is ball touching ground?
   */
  runEngineForNextFrame(userInputArray) {
    const isBallTouchingGournd = physicsEngine(
      this.player1,
      this.player2,
      this.ball,
      userInputArray
    );
    return isBallTouchingGournd;
  }
}

/**
 * Class (or precisely, Interface) representing user input (from keyboard or joystick, whatever)
 */
export class PikaUserInput {
  constructor() {
    /** @type {number} 0: no horizontal-direction input, -1: left-direction input, 1: right-direction input */
    this.xDirection = 0;
    /** @type {number} 0: no vertical-direction input, -1: up-direction input, 1: down-direction input */
    this.yDirection = 0;
    /** @type {number} 0: auto-repeated or no power hit input, 1: not auto-repeated power hit input */
    this.powerHit = 0;
  }
}

/**
 * Class representing a player
 *
 * Player 1 property address: 00411F28 -> +28 -> +10 -> +C -> ...
 * Player 2 property address: 00411F28 -> +28 -> +10 -> +10 -> ...
 * The "..." part is written on the line comment at the right side of each property.
 * e.g. address to player1.isPlayer: 00411F28 -> +28 -> +10 -> +C -> +A0
 * e.g. address to player2.isComputer: 00411F28 -> +28 -> +10 -> +10 -> +A4
 *
 * For initial values: refer FUN_000403a90 && FUN_00401f40
 */
class Player {
  /**
   * create a player
   * @param {boolean} isPlayer2 Is this player on the right side?
   * @param {boolean} isComputer Is this player controlled by computer?
   */
  constructor(isPlayer2, isComputer) {
    this.serve = new ServeMachine(isPlayer2);

    /** @type {boolean} Is this player on the right side? */
    this.isPlayer2 = isPlayer2; // 0xA0
    /** @type {boolean} Is controlled by computer? */
    this.isComputer = isComputer; // 0xA4
    this.initializeForNewRound();

    /** @type {number} -1: left, 0: no diving, 1: right */
    this.divingDirection = 0; // 0xB4
    /** @type {number} */
    this.lyingDownDurationLeft = -1; // 0xB8
    /** @type {boolean} */
    this.isWinner = false; // 0xD0
    /** @type {boolean} */
    this.gameEnded = false; // 0xD4

    /**
     * It flips randomly to 0 or 1 by the {@link letComputerDecideUserInput} function (FUN_00402360)
     * when ball is hanging around on the other player's side.
     * If it is 0, computer player stands by around the middle point of their side.
     * If it is 1, computer player stands by adjecent to the net.
     * @type {number} 0 or 1
     */
    this.computerWhereToStandBy = 0; // 0xDC

    /**
     * This property is not in the player pointers of the original source code.
     * But for sound effect (especially for stereo sound),
     * it is convinient way to give sound property to a Player.
     * The original name is stereo sound.
     * @type {Object.<string, boolean>}
     */
    this.sound = {
      pipikachu: false,
      pika: false,
      chu: false,
    };
    this.tactics = 0;
    this.goodtime = -1;
    this.attackX = 0;
    this.direction = 0;
    this.freestyle = false;
    this.secondattack = -1;
    this.secondX = 0;
  }

  /**
   * initialize for new round
   */
  initializeForNewRound() {
    /** @type {number} x coord */
    this.x = 36; // 0xA8 // initialized to 36 (player1) or 396 (player2)
    if (this.isPlayer2) {
      this.x = GROUND_WIDTH - 36;
    }
    /** @type {number} y coord */
    this.y = PLAYER_TOUCHING_GROUND_Y_COORD; // 0xAC   // initialized to 244
    /** @type {number} y direction velocity */
    this.yVelocity = 0; // 0xB0  // initialized to 0
    /** @type {boolean} */
    this.isCollisionWithBallHappened = false; // 0xBC   // initizlized to 0 i.e false

    /**
     * Player's state
     * 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving
     * 4: lying_down_after_diving
     * 5: win!, 6: lost..
     * @type {number} 0, 1, 2, 3, 4, 5 or 6
     */
    this.state = 0; // 0xC0   // initialized to 0
    /** @type {number} */
    this.frameNumber = 0; // 0xC4   // initialized to 0
    /** @type {number} */
    this.normalStatusArmSwingDirection = 1; // 0xC8  // initialized to 1
    /** @type {number} */
    this.delayBeforeNextFrame = 0; // 0xCC  // initizlized to 0

    /**
     * This value is initialized to (_rand() % 5) before the start of every round.
     * The greater the number, the bolder the computer player.
     *
     * If computer has higher boldness,
     * judges more the ball is haing around the other player's side,
     * has greater distance to the expected landing point of the ball,
     * jumps more,
     * dives less.
     * See the source code of the {@link letComputerDecideUserInput} function (FUN_00402360).
     *
     * @type {number} 0, 1, 2, 3 or 4
     */
    this.computerBoldness = rand() % 5; // 0xD8  // initialized to (_rand() % 5)
    this.serve.initializeForNewRound();
    this.tactics = 0;
    this.goodtime = -1;
    this.attackX = 0;
    this.direction = 0;
    this.freestyle = false;
    this.secondattack = -1;
    this.secondX = 0;
  }
}

/**
 * Class representing a ball
 *
 * Ball property address: 00411F28 -> +28 -> +10 -> +14 -> ...
 * The "..." part is written on the line comment at the right side of each property.
 * e.g. address to ball.fineRotation: 00411F28 -> +28 -> +10 -> +14 -> +48
 *
 * For initial Values: refer FUN_000403a90 && FUN_00402d60
 */
class Ball {
  /**
   * Create a ball
   * @param {boolean} isPlayer2Serve Will player 2 serve on this new round?
   */
  constructor(isPlayer2Serve) {
    this.initializeForNewRound(isPlayer2Serve);
    /** @type {number} x coord of expected lang point */
    this.expectedLandingPointX = 0; // 0x40
    /**
     * ball rotation frame number selector
     * During the period where it continues to be 5, hyper ball glitch occur.
     * @type {number} 0, 1, 2, 3, 4 or 5
     * */
    this.rotation = 0; // 0x44
    /** @type {number} */
    this.fineRotation = 0; // 0x48
    /** @type {number} x coord for punch effect */
    this.punchEffectX = 0; // 0x50
    /** @type {number} y coord for punch effect */
    this.punchEffectY = 0; // 0x54

    /**
     * Following previous values are for trailing effect for power hit
     * @type {number}
     */
    this.previousX = 0; // 0x58
    this.previousPreviousX = 0; // 0x5c
    this.previousY = 0; // 0x60
    this.previousPreviousY = 0; // 0x64

    /**
     * this property is not in the ball pointer of the original source code.
     * But for sound effect (especially for stereo sound),
     * it is convinient way to give sound property to a Ball.
     * The original name is stereo sound.
     */
    this.sound = {
      powerHit: false,
      ballTouchesGround: false,
    };

    this.path = Array();
    this.predict = Array();
    this.shortX = 0;
    this.farX = 0;
    this.bestDefense = 0;
  }

  /**
   * Initialize for new round
   * @param {boolean} isPlayer2Serve will player on the right side serve on this new round?
   */
  initializeForNewRound(isPlayer2Serve) {
    /** @type {number} x coord */
    this.x = 56; // 0x30    // initialized to 56 or 376
    if (isPlayer2Serve === true) {
      this.x = GROUND_WIDTH - 56;
    }
    /** @type {number} y coord */
    this.y = 0; // 0x34   // initialized to 0
    /** @type {number} x direction velocity */
    this.xVelocity = 0; // 0x38  // initialized to 0
    /** @type {number} y directin velicity */
    this.yVelocity = 1; // 0x3C  // initialized to 1
    /** @type {number} punch effect radius */
    this.punchEffectRadius = 0; // 0x4c // initialized to 0
    /** @type {boolean} is power hit */
    this.isPowerHit = false; // 0x68  // initialized to 0 i.e. false
    this.frame = 0;
    this.isPlayer2Serve = isPlayer2Serve;
  }
}

/**
 * FUN_00403dd0
 * This is the Pikachu Volleyball physics engine!
 * This physics engine calculates and set the physics values for the next frame.
 *
 * @param {Player} player1 player on the left side
 * @param {Player} player2 player on the right side
 * @param {Ball} ball ball
 * @param {PikaUserInput[]} userInputArray userInputArray[0]: user input for player 1, userInputArray[1]: user input for player 2
 * @return {boolean} Is ball tounching ground?
 */
function physicsEngine(player1, player2, ball, userInputArray) {
  const isBallTouchingGround =
    processCollisionBetweenBallAndWorldAndSetBallPosition(ball);
  // console.log(ball.path[1]);

  let player;
  let theOtherPlayer;
  for (let i = 0; i < 2; i++) {
    if (i === 0) {
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
    // FUN_00402d90 include FUN_004031b0(calculateExpectedLandingPointXFor)
    calculateExpectedLandingPointXFor(ball); // calculate expected_X;

    processPlayerMovementAndSetPlayerPosition(
      player,
      userInputArray[i],
      theOtherPlayer,
      ball
    );

    // FUN_00402830 ommited
    // FUN_00406020 ommited
    // These two functions ommited above maybe participate in graphic drawing for a player
  }

  for (let i = 0; i < 2; i++) {
    if (i === 0) {
      player = player1;
    } else {
      player = player2;
    }

    // FUN_00402810 ommited: this javascript code is refactored not to need this function

    const isHappend = isCollisionBetweenBallAndPlayerHappened(
      ball,
      player.x,
      player.y
    );
    if (isHappend === true) {
      if (player.isCollisionWithBallHappened === false) {
        processCollisionBetweenBallAndPlayer(
          ball,
          player.x,
          userInputArray[i],
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
  // These two functions ommited above maybe participate in graphic drawing for a player

  return isBallTouchingGround;
}

/**
 * FUN_00403070
 * Is collision between ball and player happend?
 * @param {Ball} ball
 * @param {Player["x"]} playerX player.x
 * @param {Player["y"]} playerY player.y
 * @return {boolean}
 */
function isCollisionBetweenBallAndPlayerHappened(ball, playerX, playerY) {
  let diff = ball.x - playerX;
  if (Math.abs(diff) <= PLAYER_HALF_LENGTH) {
    diff = ball.y - playerY;
    if (Math.abs(diff) <= PLAYER_HALF_LENGTH) {
      return true;
    }
  }
  return false;
}

/**
 * FUN_00402dc0
 * Process collision between ball and world and set ball position
 * @param {Ball} ball
 * @return {boolean} Is ball touching ground?
 */
function processCollisionBetweenBallAndWorldAndSetBallPosition(ball) {
  // This is not part of this function in the original assembly code.
  // In the original assembly code, it is processed in other function (FUN_00402ee0)
  // But it is proper to process here.
  ball.previousPreviousX = ball.previousX;
  ball.previousPreviousY = ball.previousY;
  ball.previousX = ball.x;
  ball.previousY = ball.y;
  ball.frame += 1;

  // "(ball.xVelocity / 2) | 0" is integer division by 2
  let futureFineRotation = ball.fineRotation + ((ball.xVelocity / 2) | 0);
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
  ball.rotation = (ball.fineRotation / 10) | 0; // integer division

  const futureBallX = ball.x + ball.xVelocity;
  /*
    If the center of ball would get out of left world bound or right world bound, bounce back.
    
    In this if statement, when considering left-right symmetry,
    "futureBallX > GROUND_WIDTH" should be changed to "futureBallX > (GROUND_WIDTH - BALL_RADIUS)",
    or "futureBallX < BALL_RADIUS" should be changed to "futureBallX < 0".
    Maybe the former one is more proper when seeing Pikachu player's x-direction boundary.
    Is this a mistake of the author of the original game?
    Or, was it set to this value to resolve inifite loop problem? (See comments on the constant INFINITE_LOOP_LIMIT.)
    If apply (futureBallX > (GROUND_WIDTH - BALL_RADIUS)), and if the maximum number of loop is not limited,
    it is observed that inifinite loop in the function expectedLandingPointXWhenPowerHit does not terminate.
  */
  if (futureBallX < BALL_RADIUS || futureBallX > GROUND_WIDTH) {
    ball.xVelocity = -ball.xVelocity;
  }

  let futureBallY = ball.y + ball.yVelocity;
  // if the center of ball would get out of upper world bound
  if (futureBallY < 0) {
    ball.yVelocity = 1;
  }

  // If ball touches net
  if (
    Math.abs(ball.x - GROUND_HALF_WIDTH) < NET_PILLAR_HALF_WIDTH &&
    ball.y > NET_PILLAR_TOP_TOP_Y_COORD
  ) {
    if (ball.y <= NET_PILLAR_TOP_BOTTOM_Y_COORD) {
      if (ball.yVelocity > 0) {
        ball.yVelocity = -ball.yVelocity;
      }
    } else {
      if (ball.x < GROUND_HALF_WIDTH) {
        ball.xVelocity = -Math.abs(ball.xVelocity);
      } else {
        ball.xVelocity = Math.abs(ball.xVelocity);
      }
    }
  }
  // // 帶入不同狀況來算
  // ball.predict = Array();
  // for (let yDirection = -1; yDirection < 2; yDirection++) {
  //   for (let xDirection = 0; xDirection < 2; xDirection++) {
  //     calculateExpectedLandingPointXwithpredict(ball, xDirection, yDirection);
  //   }
  // }

  futureBallY = ball.y + ball.yVelocity;
  // if ball would touch ground
  if (futureBallY > BALL_TOUCHING_GROUND_Y_COORD) {
    // FUN_00408470 omitted
    // the function omitted above receives 100 * (ball.x - 216),
    // i.e. horizontal displacement from net maybe for stereo sound?
    // code function (ballpointer + 0x28 + 0x10)? omitted
    // the omitted two functions maybe do a part of sound playback role.
    ball.sound.ballTouchesGround = true;

    ball.yVelocity = -ball.yVelocity;
    ball.punchEffectX = ball.x;
    ball.y = BALL_TOUCHING_GROUND_Y_COORD;
    ball.punchEffectRadius = BALL_RADIUS;
    ball.punchEffectY = BALL_TOUCHING_GROUND_Y_COORD + BALL_RADIUS;
    return true;
  }
  ball.y = futureBallY;
  ball.x = ball.x + ball.xVelocity;
  ball.yVelocity += 1;

  return false;
}

/**
 * FUN_00401fc0
 * Process player movement according to user input and set player position
 * @param {Player} player
 * @param {PikaUserInput} userInput
 * @param {Player} theOtherPlayer
 * @param {Ball} ball
 */
function processPlayerMovementAndSetPlayerPosition(
  player,
  userInput,
  theOtherPlayer,
  ball
) {
  if (player.isComputer === true) {
    // if (player.isPlayer2) {
    letAIDecideUserInput(player, ball, theOtherPlayer, userInput);
    // } else {
    //   letComputerDecideUserInput(player, ball, theOtherPlayer, userInput);
    // }
  }

  // if player is lying down.. don't move
  if (player.state === 4) {
    player.lyingDownDurationLeft += -1;
    if (player.lyingDownDurationLeft < -1) {
      player.state = 0;
    }
    return;
  }

  // process x-direction movement
  let playerVelocityX = 0;
  if (player.state < 5) {
    if (player.state < 3) {
      playerVelocityX = userInput.xDirection * 6;
    } else {
      // player.state === 3 i.e. player is diving..
      playerVelocityX = player.divingDirection * 8;
    }
  }

  const futurePlayerX = player.x + playerVelocityX;
  player.x = futurePlayerX;

  // process player's x-direction world boundary
  if (player.isPlayer2 === false) {
    // if player is player1
    if (futurePlayerX < PLAYER_HALF_LENGTH) {
      player.x = PLAYER_HALF_LENGTH;
    } else if (futurePlayerX > GROUND_HALF_WIDTH - PLAYER_HALF_LENGTH) {
      player.x = GROUND_HALF_WIDTH - PLAYER_HALF_LENGTH;
    }
  } else {
    // if player is player2
    if (futurePlayerX < GROUND_HALF_WIDTH + PLAYER_HALF_LENGTH) {
      player.x = GROUND_HALF_WIDTH + PLAYER_HALF_LENGTH;
    } else if (futurePlayerX > GROUND_WIDTH - PLAYER_HALF_LENGTH) {
      player.x = GROUND_WIDTH - PLAYER_HALF_LENGTH;
    }
  }

  // jump
  if (
    player.state < 3 &&
    userInput.yDirection === -1 && // up-direction input
    player.y === PLAYER_TOUCHING_GROUND_Y_COORD // player is touching on the ground
  ) {
    player.yVelocity = -16;
    player.state = 1;
    player.frameNumber = 0;
    // maybe-stereo-sound function FUN_00408470 (0x90) ommited:
    // refer a detailed comment above about this function
    // maybe-sound code function (playerpointer + 0x90 + 0x10)? ommited
    player.sound.chu = true;
  }

  // gravity
  const futurePlayerY = player.y + player.yVelocity;
  player.y = futurePlayerY;
  if (futurePlayerY < PLAYER_TOUCHING_GROUND_Y_COORD) {
    player.yVelocity += 1;
  } else if (futurePlayerY > PLAYER_TOUCHING_GROUND_Y_COORD) {
    // if player is landing..
    player.yVelocity = 0;
    player.y = PLAYER_TOUCHING_GROUND_Y_COORD;
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

  if (userInput.powerHit === 1) {
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
      player.sound.pika = true;
    } else if (player.state === 0 && userInput.xDirection !== 0) {
      // then player do diving!
      player.state = 3;
      player.frameNumber = 0;
      player.divingDirection = userInput.xDirection;
      player.yVelocity = -5;
      // maybe-stereo-sound function FUN_00408470 (0x90) ommited:
      // refer a detailed comment above about this function
      // maybe-sound code function (playerpointer + 0x90 + 0x10)? ommited
      player.sound.chu = true;
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
      const futureFrameNumber =
        player.frameNumber + player.normalStatusArmSwingDirection;
      if (futureFrameNumber < 0 || futureFrameNumber > 4) {
        player.normalStatusArmSwingDirection =
          -player.normalStatusArmSwingDirection;
      }
      player.frameNumber =
        player.frameNumber + player.normalStatusArmSwingDirection;
    }
  }

  if (player.gameEnded === true) {
    if (player.state === 0) {
      if (player.isWinner === true) {
        player.state = 5;
        // maybe-stereo-sound function FUN_00408470 (0x90) ommited:
        // refer a detailed comment above about this function
        // maybe-sound code function (0x98 + 0x10) ommited
        player.sound.pipikachu = true;
      } else {
        player.state = 6;
      }
      player.delayBeforeNextFrame = 0;
      player.frameNumber = 0;
    }
    processGameEndFrameFor(player);
  }
}

/**
 * FUN_004025e0
 * Process game end frame (for winner and loser motions) for the given player
 * @param {Player} player
 */
function processGameEndFrameFor(player) {
  if (player.gameEnded === true && player.frameNumber < 4) {
    player.delayBeforeNextFrame += 1;
    if (player.delayBeforeNextFrame > 4) {
      player.delayBeforeNextFrame = 0;
      player.frameNumber += 1;
    }
  }
}

/**
 * FUN_004030a0
 * Process collision between ball and player.
 * This function only sets velocity of ball and expected landing point x of ball.
 * This function does not set position of ball.
 * The ball position is set by {@link processCollisionBetweenBallAndWorldAndSetBallPosition} function
 *
 * @param {Ball} ball
 * @param {Player["x"]} playerX
 * @param {PikaUserInput} userInput
 * @param {Player["state"]} playerState
 */
function processCollisionBetweenBallAndPlayer(
  ball,
  playerX,
  userInput,
  playerState
) {
  // playerX is maybe pika's x position
  // if collision occur,
  // greater the x position difference between pika and ball,
  // greater the x velocity of the ball.
  if (ball.x < playerX) {
    // Since javascript division is float division by default,
    // Here we use "| 0" to do integer division (refer: https://stackoverflow.com/a/17218003/8581025)
    ball.xVelocity = -((Math.abs(ball.x - playerX) / 3) | 0);
  } else if (ball.x > playerX) {
    ball.xVelocity = (Math.abs(ball.x - playerX) / 3) | 0;
  }

  // If ball velocity x is 0, randomly choose one of -1, 0, 1.
  if (ball.xVelocity === 0) {
    ball.xVelocity = (rand() % 3) - 1;
  }

  const ballAbsYVelocity = Math.abs(ball.yVelocity);
  ball.yVelocity = -ballAbsYVelocity;

  if (ballAbsYVelocity < 15) {
    ball.yVelocity = -15;
  }

  // player is jumping and power hitting
  if (playerState === 2) {
    // console.log(ball.path);
    if (ball.x < GROUND_HALF_WIDTH) {
      ball.xVelocity = (Math.abs(userInput.xDirection) + 1) * 10;
    } else {
      ball.xVelocity = -(Math.abs(userInput.xDirection) + 1) * 10;
    }
    ball.punchEffectX = ball.x;
    ball.punchEffectY = ball.y;

    ball.yVelocity = Math.abs(ball.yVelocity) * userInput.yDirection * 2;
    ball.punchEffectRadius = BALL_RADIUS;
    // maybe-stereo-sound function FUN_00408470 (0x90) ommited:
    // refer a detailed comment above about this function
    // maybe-soundcode function (ballpointer + 0x24 + 0x10) ommited:
    ball.sound.powerHit = true;

    ball.isPowerHit = true;
  } else {
    ball.isPowerHit = false;
  }

  calculateExpectedLandingPointXFor(ball);
}

/**
 * FUN_004031b0
 * Calculate x coordinate of expected landing point of the ball
 * @param {Ball} ball
 */
function calculateExpectedLandingPointXFor(ball) {
  const copyBall = {
    x: ball.x,
    y: ball.y,
    xVelocity: ball.xVelocity,
    yVelocity: ball.yVelocity,
    predict: Array(),
  };
  let loopCounter = 0;
  ball.path = Array();
  copyBall.predict = Array();
  for (let yDirection = -1; yDirection < 2; yDirection++) {
    for (let xDirection = 0; xDirection < 2; xDirection++) {
      calculateExpectedLandingPointXwithpredict(
        copyBall,
        xDirection,
        yDirection
      );
    }
  }
  ball.path.push(Object.assign({}, copyBall));

  while (true) {
    loopCounter++;

    const futureCopyBallX = copyBall.xVelocity + copyBall.x;
    if (futureCopyBallX < BALL_RADIUS || futureCopyBallX > GROUND_WIDTH) {
      copyBall.xVelocity = -copyBall.xVelocity;
    }
    if (copyBall.y + copyBall.yVelocity < 0) {
      copyBall.yVelocity = 1;
    }

    // If copy ball touches net
    if (
      Math.abs(copyBall.x - GROUND_HALF_WIDTH) < NET_PILLAR_HALF_WIDTH &&
      copyBall.y > NET_PILLAR_TOP_TOP_Y_COORD
    ) {
      // It maybe should be <= NET_PILLAR_TOP_BOTTOM_Y_COORD as in FUN_00402dc0, is it the original game author's mistake?
      if (copyBall.y <= NET_PILLAR_TOP_BOTTOM_Y_COORD) {
        if (copyBall.yVelocity > 0) {
          copyBall.yVelocity = -copyBall.yVelocity;
        }
      } else {
        if (copyBall.x < GROUND_HALF_WIDTH) {
          copyBall.xVelocity = -Math.abs(copyBall.xVelocity);
        } else {
          copyBall.xVelocity = Math.abs(copyBall.xVelocity);
        }
      }
    }

    copyBall.y = copyBall.y + copyBall.yVelocity;
    // if copyBall would touch ground
    if (
      copyBall.y > BALL_TOUCHING_GROUND_Y_COORD ||
      loopCounter >= INFINITE_LOOP_LIMIT
    ) {
      break;
    }
    copyBall.x = copyBall.x + copyBall.xVelocity;
    copyBall.yVelocity += 1;
    // 帶入不同狀況來算
    if (ball.path.length < 33) {
      copyBall.predict = Array();
      for (let yDirection = -1; yDirection < 2; yDirection++) {
        for (let xDirection = 0; xDirection < 2; xDirection++) {
          calculateExpectedLandingPointXwithpredict(
            copyBall,
            xDirection,
            yDirection
          );
        }
      }
    }
    ball.path.push(Object.assign({}, copyBall));
  }
  ball.expectedLandingPointX = copyBall.x;
}

function calculateExpectedLandingPointXwithpredict(
  ball,
  xDirection,
  yDirection
) {
  const copyBall = {
    x: ball.x,
    y: ball.y,
    xVelocity: ball.xVelocity,
    yVelocity: ball.yVelocity,
  };
  // 調整力道

  const ballAbsYVelocity = Math.abs(copyBall.yVelocity);
  copyBall.yVelocity = -ballAbsYVelocity;

  if (ballAbsYVelocity < 15) {
    copyBall.yVelocity = -15;
  }
  if (copyBall.x < GROUND_HALF_WIDTH) {
    copyBall.xVelocity = (Math.abs(xDirection) + 1) * 10;
  } else {
    copyBall.xVelocity = -(Math.abs(xDirection) + 1) * 10;
  }
  copyBall.yVelocity = Math.abs(copyBall.yVelocity) * yDirection * 2;

  let loopCounter = 0;
  const tmppath = Array();
  while (true) {
    loopCounter++;

    const futureCopyBallX = copyBall.xVelocity + copyBall.x;
    if (futureCopyBallX < BALL_RADIUS || futureCopyBallX > GROUND_WIDTH) {
      copyBall.xVelocity = -copyBall.xVelocity;
    }
    if (copyBall.y + copyBall.yVelocity < 0) {
      copyBall.yVelocity = 1;
    }

    // If copy ball touches net
    if (
      Math.abs(copyBall.x - GROUND_HALF_WIDTH) < NET_PILLAR_HALF_WIDTH &&
      copyBall.y > NET_PILLAR_TOP_TOP_Y_COORD
    ) {
      // It maybe should be <= NET_PILLAR_TOP_BOTTOM_Y_COORD as in FUN_00402dc0, is it the original game author's mistake?
      if (copyBall.y <= NET_PILLAR_TOP_BOTTOM_Y_COORD) {
        if (copyBall.yVelocity > 0) {
          copyBall.yVelocity = -copyBall.yVelocity;
        }
      } else {
        if (copyBall.x < GROUND_HALF_WIDTH) {
          copyBall.xVelocity = -Math.abs(copyBall.xVelocity);
        } else {
          copyBall.xVelocity = Math.abs(copyBall.xVelocity);
        }
      }
    }

    copyBall.y = copyBall.y + copyBall.yVelocity;
    // if copyBall would touch ground
    if (
      copyBall.y > BALL_TOUCHING_GROUND_Y_COORD ||
      loopCounter >= INFINITE_LOOP_LIMIT
    ) {
      tmppath.push(Object.assign({}, copyBall));
      break;
    }
    copyBall.x = copyBall.x + copyBall.xVelocity;
    copyBall.yVelocity += 1;
    tmppath.push(Object.assign({}, copyBall));
  }
  ball.predict.push(tmppath);
}

function playerYpredict(player, frame) {
  if (player.state === 0) {
    let total = -16;
    let speed = -15;
    for (let i = 0; i < frame; i++) {
      total += speed;
      speed += 1;
    }
    if (total > 0) {
      return PLAYER_TOUCHING_GROUND_Y_COORD;
    }
    return PLAYER_TOUCHING_GROUND_Y_COORD + total;
  } else {
    let speed = player.yVelocity;
    let realY = player.y + speed;
    for (let i = 0; i < frame; i++) {
      speed += 1;
      realY += speed;
    }
    if (realY > PLAYER_TOUCHING_GROUND_Y_COORD) {
      return PLAYER_TOUCHING_GROUND_Y_COORD;
    }
    return realY;
  }
}

function otherPlayerYpredict(player, frame) {
  if (player.isPlayer2) {
    return playerYpredict(player, frame);
  } else {
    let speed = player.yVelocity;
    let realY = player.y;
    for (let i = 0; i < frame; i++) {
      realY += speed;
      speed += 1;
    }
    if (realY > PLAYER_TOUCHING_GROUND_Y_COORD) {
      return PLAYER_TOUCHING_GROUND_Y_COORD;
    }
    return realY;
  }
}

/**
 * 如果球power hit 跑到 path最後位置
 * 如果球沒有power hit 跑到predict 最短路徑位置
 *
 * @param {Player} player The player whom computer contorls
 * @param {number} ballX ball
 */
function sameside(player, ballX) {
  if (ballX === GROUND_HALF_WIDTH) {
    return true;
  }
  return player.isPlayer2
    ? ballX > GROUND_HALF_WIDTH
    : ballX < GROUND_HALF_WIDTH;
}

/**
 * 如果球power hit 跑到 path最後位置
 * 如果球沒有power hit 跑到predict 最短路徑位置
 *
 * @param {Player} player The player whom computer contorls
 * @param {number} ballX ball
 */
function samesideloss(player, ballX) {
  return player.isPlayer2
    ? ballX >= GROUND_HALF_WIDTH
    : ballX < GROUND_HALF_WIDTH;
}

/**
 * 如果球power hit 跑到 path最後位置
 * 如果球沒有power hit 跑到predict 最短路徑位置
 *
 * @param {Player} player The player whom computer contorls
 * @param {Array} predict ball
 */
function canblock(player, predict) {
  if (predict.length < 7) {
    return false;
  }
  let first = true;
  for (let frame = 0; frame < predict.length; frame++) {
    if (sameside(player, predict[frame].x)) {
      if (first) {
        if (predict[frame].y > NET_PILLAR_TOP_BOTTOM_Y_COORD) {
          return false;
        }
        first = false;
      }
      if (Math.abs(predict[frame].x - GROUND_HALF_WIDTH) > PLAYER_LENGTH + 60) {
        return false;
      }
      if (
        Math.abs(otherPlayerYpredict(player, frame) - predict[frame].y) <=
        PLAYER_HALF_LENGTH
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 如果球power hit 跑到 path最後位置
 * 如果球沒有power hit 跑到predict 最短路徑位置
 *
 * @param {Player} player The player whom computer contorls
 * @param {Array} predict ball
 */
function canblockPredict(player, predict) {
  if (predict.length < 7) {
    return false;
  }
  let first = true;
  for (let frame = 0; frame < predict.length; frame++) {
    if (sameside(player, predict[frame].x)) {
      if (first) {
        if (predict[frame].y > NET_PILLAR_TOP_BOTTOM_Y_COORD) {
          return false;
        }
        first = false;
      }
      if (Math.abs(predict[frame].x - GROUND_HALF_WIDTH) > PLAYER_LENGTH + 60) {
        return false;
      }
      // 244-32-16-15-14-13-12-11-10-9-8-7
      if (predict[frame].y > 104) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 如果球power hit 跑到 path最後位置
 * 如果球沒有power hit 跑到predict 最短路徑位置
 *
 * @param {Player} player The player whom computer contorls
 * @param {Ball} copyball ball
 * @param {Number} frame ball
 */
function cantouch(player, copyball, frame) {
  if (copyball.y < 76) {
    return false;
  }
  if (
    sameside(player, copyball.x) &&
    Math.abs(copyball.x - player.x) <= 6 * frame + PLAYER_HALF_LENGTH + 6
  ) {
    let needframe = -1;
    if (player.state > 0) {
      needframe = 16 - player.yVelocity;
      if (frame < needframe) {
        return true;
      }
    }
    let top = PLAYER_TOUCHING_GROUND_Y_COORD - PLAYER_HALF_LENGTH;
    let speed = -16;
    for (let count = 0; count < frame - needframe; count++) {
      top += speed;
      speed += 1;
    }
    return copyball.y >= top;
  }
  return false;
}

/**
 * FUN_00402360
 * Computer controls its player by this function.
 * Computer decides the user input for the player it controls,
 * according to the game situation it figures out
 * by the given parameters (player, ball and theOtherplayer),
 * and reflects these to the given user input object.
 * 如果球power hit 跑到 path最後位置
 * 如果球沒有power hit 跑到predict 最短路徑位置
 *
 * @param {Player} player The player whom computer contorls
 * @param {Ball} ball ball
 * @param {Player} theOtherPlayer The other player
 * @param {PikaUserInput} userInput user input of the player whom computer controls
 */
function letAIDecideUserInput(player, ball, theOtherPlayer, userInput) {
  userInput.xDirection = 0;
  userInput.yDirection = 0;
  userInput.powerHit = 0;
  // console.log('frame:' + ball.frame);
  // console.log('xVelocity:' + ball.xVelocity);
  // console.log('yVelocity:' + ball.yVelocity);
  // console.log('tactics:' + player.tactics);
  // console.log('expectedLandingPointX:' + ball.expectedLandingPointX);
  // if (!player.isPlayer2) {
  //   player.serve.executeMove(player, ball, theOtherPlayer, userInput);
  //   return;
  // }

  // 判斷半步拖球
  // if (
  //   ball.frame === 22 &&
  //   ball.expectedLandingPointX === (player.isPlayer2 ? 184 : 248)
  // ) {
  //   player.tactics = 1;
  // }
  // // 尾閃拖
  // if (
  //   ball.frame === 22 &&
  //   ball.expectedLandingPointX === (player.isPlayer2 ? 392 : 236)
  // ) {
  //   player.tactics = 2;
  // }
  if (
    ball.frame < 5 &&
    (player.isPlayer2 ? ball.isPlayer2Serve : !ball.isPlayer2Serve)
  ) {
    // 發球
    player.tactics = 3;
  }
  if (player.tactics === 0) {
    // 平常狀態
    let virtualExpectedLandingPointX;
    let maychange = false;
    let diving = false;
    // predict 2sec attack
    // console.log(ball.path);
    if (theOtherPlayer.state > 0 && Math.abs(ball.xVelocity) > 9) {
      for (let frame = 0; frame < ball.path.length; frame++) {
        const copyball = ball.path[frame];
        if (!sameside(theOtherPlayer, copyball.x)) {
          break;
        }
        if (
          Math.abs(copyball.y - otherPlayerYpredict(theOtherPlayer, frame)) <=
            PLAYER_HALF_LENGTH &&
          Math.abs(copyball.x - theOtherPlayer.x) <=
            6 * frame + PLAYER_HALF_LENGTH + 6
        ) {
          maychange = true;
          // console.log((player.isPlayer2 ? '2' : '1') + ':detect maychange');
          // console.log(copyball);
          break;
        }
      }
    }
    if (player.state === 0 || player.yVelocity === 16) {
      player.secondattack = -1;
    }
    if (
      !sameside(player, ball.expectedLandingPointX) ||
      (sameside(theOtherPlayer, ball.x) && Math.abs(ball.xVelocity) < 10) ||
      maychange
    ) {
      // console.log((player.isPlayer2 ? '2' : '1') + ': predict');
      // predict defense
      let short_len = 1000;
      let short_x = 216;
      let closeDiff = 216;
      for (let frame = 0; frame < ball.path.length && frame < 16; frame++) {
        const copyball = ball.path[frame];
        if (cantouch(theOtherPlayer, copyball, frame)) {
          for (let direct = 0; direct < 6; direct++) {
            const predict = copyball.predict[direct];
            // thunder
            if (
              predict.length > 3 &&
              predict[0].yVelocity > 30 &&
              predict[3].yVelocity < -27 &&
              sameside(theOtherPlayer, predict[2].x)
            ) {
              short_len = 0;
              short_x = GROUND_HALF_WIDTH;
              // console.log(
              //   (player.isPlayer2 ? '2' : '1') + ':predict thunder defense'
              // );
              break;
              // } else if (
              //   // small double
              //   ball.isPowerHit &&
              //   maychange === true &&
              //   Math.abs(ball.xVelocity) === 10 &&
              //   Math.abs(ball.yVelocity) < 20
              // ) {
              //   short_len = 0;
              //   short_x = GROUND_HALF_WIDTH;
              //   break;
              // } else if (
              //   sameside(player, ball.expectedLandingPointX) &&
              //   ball.path.length < 10
              // ) {
              //   short_x = ball.expectedLandingPointX;
              //   console.log('here');
              //   break;
            } else {
              // normal
              if (
                sameside(player, predict[predict.length - 1].x) &&
                (predict.length < short_len ||
                  (predict.length === short_len &&
                    Math.abs(
                      predict[predict.length - 1].x - GROUND_HALF_WIDTH
                    ) < closeDiff))
              ) {
                short_len = predict.length;
                closeDiff = Math.abs(short_x - GROUND_HALF_WIDTH);
                short_x = predict[predict.length - 1].x;
                if (Math.abs(short_x - GROUND_HALF_WIDTH) > 72) {
                  short_x =
                    short_x + (short_len - 1) * (player.isPlayer2 ? -6 : 6);
                  if (Math.abs(short_x - GROUND_HALF_WIDTH) < 72) {
                    short_x = GROUND_HALF_WIDTH + (player.isPlayer2 ? 72 : -72);
                  }
                }
              }
            }
          }
        }
        if (short_len === 0) {
          break;
        }
      }
      if (short_len === 1000 && sameside(player, ball.expectedLandingPointX)) {
        short_x = ball.expectedLandingPointX;
      }

      virtualExpectedLandingPointX = short_x;
      // second attack
      if (player.secondattack > -1 && player.goodtime < 0) {
        virtualExpectedLandingPointX = player.secondX;
      }
      // console.log(
      //   (player.isPlayer2 ? '2: ' : '1: ') + virtualExpectedLandingPointX
      // );
      player.goodtime = -1;
    } else {
      // console.log((player.isPlayer2 ? '2' : '1') + ': now');
      // normal defense
      virtualExpectedLandingPointX = ball.expectedLandingPointX;

      // jumping defense
      if (
        player.state > 0 &&
        player.yVelocity < 16 &&
        !player.isCollisionWithBallHappened
      ) {
        for (let frame = 0; frame < ball.path.length; frame++) {
          const copyball = ball.path[frame];
          if (
            sameside(player, copyball.x) &&
            Math.abs(playerYpredict(player, frame) - copyball.y) <=
              PLAYER_HALF_LENGTH &&
            Math.abs(player.x - copyball.x) <=
              6 * frame + PLAYER_HALF_LENGTH + 6
          ) {
            virtualExpectedLandingPointX = copyball.x;
            // console.log('jumping defense');
          }
        }
      }

      // thunder defense
      let thunder_defense = false;
      if (sameside(theOtherPlayer, ball.x)) {
        for (let frame = 0; frame < ball.path.length && frame < 4; frame++) {
          const copyball = ball.path[frame];
          if (
            sameside(theOtherPlayer, copyball.x) &&
            copyball.yVelocity < -29
          ) {
            // console.log((player.isPlayer2 ? '2' : '1') + ':thunder defense');
            virtualExpectedLandingPointX = GROUND_HALF_WIDTH;
            thunder_defense = true;
            break;
          }
        }
      }
      if (ball.yVelocity > 60) {
        virtualExpectedLandingPointX = GROUND_HALF_WIDTH;
        userInput.yDirection = -1;
      }

      // check collision
      if (theOtherPlayer.isCollisionWithBallHappened) {
        player.goodtime = -1;
        player.secondattack = -1;
      }

      // attack
      if (!thunder_defense && player.goodtime < 0 && player.secondattack < 0) {
        let shortPath = 1000;
        let longDiff = 0;

        // jumping ball from x;
        if (
          player.state > 0 &&
          player.yVelocity < 16 &&
          Math.abs(playerYpredict(player, 0) - ball.y) <= PLAYER_HALF_LENGTH &&
          Math.abs(player.x - ball.x) <= PLAYER_HALF_LENGTH &&
          sameside(player, ball.x) &&
          !player.isCollisionWithBallHappened
        ) {
          const copyball = ball.path[0];

          // freestyle
          for (let direct = 1; direct < 6 && shortPath > -1; direct++) {
            const predict = copyball.predict[direct];
            for (
              let predictframe = 1;
              predictframe < predict.length - 1;
              predictframe++
            ) {
              const predictball = predict[predictframe];
              if (sameside(theOtherPlayer, predictball.x)) {
                break;
              }
              if (
                Math.abs(
                  predictball.y - playerYpredict(player, predictframe + 1)
                ) <= PLAYER_HALF_LENGTH &&
                Math.abs(
                  predict[predictframe - 1].y -
                    playerYpredict(player, predictframe)
                ) > PLAYER_HALF_LENGTH &&
                Math.abs(predictball.x - player.x) <=
                  6 * predictframe + PLAYER_HALF_LENGTH
              ) {
                shortPath = -1;
                player.goodtime = 0;
                player.attackX = predictball.x;
                player.direction = direct;
                player.freestyle = true;
                player.secondX =
                  predictball.x +
                  (player.isPlayer2
                    ? -PLAYER_HALF_LENGTH + 9
                    : PLAYER_HALF_LENGTH - 9);
                player.secondattack = predictframe + 1;
                // console.log((player.isPlayer2 ? '2' : '1') + ':jump freestyle');
                // console.log(predict);
                // console.log('predictframe ' + predictframe);
                // console.log('player.yVelocity ' + player.yVelocity);
                // console.log('direct ' + direct);
                break;
              }
            }
          }

          // normal
          if (shortPath > -1) {
            for (let direct = 2; direct < 6; direct++) {
              const predict = copyball.predict[direct];
              if (
                samesideloss(theOtherPlayer, predict[predict.length - 1].x) &&
                predict.length < shortPath
              ) {
                shortPath = predict.length;
                player.goodtime = 0;
                player.attackX = copyball.x;
                player.direction = direct;
              }
            }
          }
          // 0sec
        } else if (
          player.state === 0 &&
          Math.abs(player.y - 16 - ball.path[0].y) <= PLAYER_HALF_LENGTH &&
          Math.abs(player.x - ball.path[0].x) <= PLAYER_HALF_LENGTH + 6 &&
          sameside(player, ball.x) &&
          !player.isCollisionWithBallHappened
        ) {
          const copyball = ball.path[0];

          // freestyle
          const predict = copyball.predict[1];
          for (
            let predictframe = 1;
            predictframe < predict.length - 1;
            predictframe++
          ) {
            const predictball = predict[predictframe];
            if (sameside(theOtherPlayer, predictball.x)) {
              break;
            }
            if (
              Math.abs(
                predictball.y - playerYpredict(player, predictframe + 1)
              ) <= PLAYER_HALF_LENGTH &&
              Math.abs(
                predict[predictframe - 1].y -
                  playerYpredict(player, predictframe)
              ) > PLAYER_HALF_LENGTH &&
              Math.abs(predictball.x - player.x) <=
                6 * predictframe + PLAYER_LENGTH + 6 &&
              rand() % 10 < 8
            ) {
              shortPath = -1;
              player.goodtime = 0;
              player.attackX = copyball.x;
              player.direction = 1;
              userInput.yDirection = -1;
              player.freestyle = true;
              player.secondX =
                predictball.x +
                (player.isPlayer2
                  ? -PLAYER_HALF_LENGTH + 9
                  : PLAYER_HALF_LENGTH - 9);
              player.secondattack = predictframe + 1;
              // console.log((player.isPlayer2 ? '2' : '1') + ':0sec freestyle');
            }
          }

          // jump or miss
          if (
            shortPath > -1 &&
            sameside(player, ball.expectedLandingPointX) &&
            Math.abs(player.x - ball.expectedLandingPointX) >
              ball.path.length * 6 + PLAYER_HALF_LENGTH
          ) {
            for (let direct = 0; direct < 2; direct++) {
              const predict = copyball.predict[direct];
              const diff = Math.abs(
                predict[predict.length - 1].x - GROUND_HALF_WIDTH
              );
              if (
                samesideloss(theOtherPlayer, predict[predict.length - 1].x) &&
                diff >= longDiff
              ) {
                longDiff = diff;
                player.goodtime = 0;
                player.attackX = ball.path[0].x;
                player.direction = direct;
                userInput.yDirection = -1;
                // console.log((player.isPlayer2 ? '2' : '1') + ':0sec');
              }
            }
          }
        } else {
          // normal
          const lock1 = rand() % 10;
          const lock2 = rand() % 10;
          const lock3 = rand() % 20;
          for (
            let frame = 1;
            frame < ball.path.length && frame < 31 && shortPath > -1;
            frame++
          ) {
            const copyball = ball.path[frame];
            if (
              Math.abs(playerYpredict(player, frame) - copyball.y) <=
                PLAYER_HALF_LENGTH &&
              Math.abs(
                playerYpredict(player, frame - 1) - ball.path[frame - 1].y
              ) > PLAYER_HALF_LENGTH &&
              sameside(player, copyball.x) &&
              Math.abs(player.x - copyball.x) <= 6 * frame + PLAYER_HALF_LENGTH
            ) {
              // freestyle
              for (let direct = 1; direct < 6; direct++) {
                const predict = copyball.predict[direct];
                for (
                  let predictframe = 1;
                  predictframe < predict.length - 1;
                  predictframe++
                ) {
                  const predictball = predict[predictframe];
                  if (sameside(theOtherPlayer, predictball.x)) {
                    break;
                  }
                  if (
                    Math.abs(
                      predictball.y -
                        playerYpredict(player, frame + predictframe + 1)
                    ) <= PLAYER_HALF_LENGTH &&
                    Math.abs(
                      predict[predictframe - 1].y -
                        playerYpredict(player, frame + predictframe)
                    ) > PLAYER_HALF_LENGTH &&
                    Math.abs(predictball.x - copyball.x) <=
                      6 * predictframe + PLAYER_LENGTH
                  ) {
                    if (
                      direct === 2 &&
                      Math.abs(predictball.x - GROUND_HALF_WIDTH) > 45
                    ) {
                      continue;
                    }
                    shortPath = -1;
                    player.goodtime = frame;
                    const tail = player.isPlayer2
                      ? -PLAYER_HALF_LENGTH + (direct % 2 === 1 ? 9 : 3)
                      : PLAYER_HALF_LENGTH - (direct % 2 === 1 ? 9 : 3);
                    player.attackX = copyball.x + tail;
                    player.direction = direct;
                    userInput.yDirection = -1;
                    player.freestyle = true;
                    player.secondX =
                      predictball.x +
                      (player.isPlayer2
                        ? -PLAYER_HALF_LENGTH + 9
                        : PLAYER_HALF_LENGTH - 9);
                    player.secondattack = frame + predictframe + 1;
                    // console.log((player.isPlayer2 ? '2' : '1') + ':freestyle');
                    // console.log(
                    //   playerYpredict(player, frame + predictframe + 1)
                    // );
                    // console.log(frame);
                    break;
                  }
                }
              }
              // normal
              if (shortPath > -1) {
                // jump or miss
                if (
                  Math.abs(player.x - ball.expectedLandingPointX) >
                  ball.path.length * 6 + PLAYER_HALF_LENGTH
                ) {
                  for (let direct = 0; direct < 6; direct++) {
                    const predict = copyball.predict[direct];
                    const diff = Math.abs(
                      predict[predict.length - 1].x - GROUND_HALF_WIDTH
                    );
                    if (
                      samesideloss(
                        theOtherPlayer,
                        predict[predict.length - 1].x
                      ) &&
                      diff >= longDiff
                    ) {
                      longDiff = diff;
                      player.goodtime = frame;
                      player.attackX = copyball.x;
                      player.direction = direct;
                      userInput.yDirection = -1;
                    }
                  }
                } else {
                  // noraml;
                  // random;
                  if (rand() % 10 < 2) {
                    continue;
                  }
                  // long high ball
                  if (
                    player.state === 0 &&
                    Math.abs(copyball.x - GROUND_HALF_WIDTH) > 144 &&
                    copyball.y < lock1 + 80
                  ) {
                    continue;
                  }
                  for (let direct = 2; direct < 6; direct++) {
                    // early hit
                    if (
                      direct < 4 &&
                      player.state === 0 &&
                      frame < lock2 + 10 &&
                      Math.abs(theOtherPlayer.x - GROUND_HALF_WIDTH) < 144 &&
                      (theOtherPlayer.yVelocity > -1 ||
                        Math.abs(copyball.x - GROUND_HALF_WIDTH) > 72)
                    ) {
                      continue;
                    }
                    const predict = copyball.predict[direct];
                    // long ball
                    if (
                      predict.length > lock3 + 10 &&
                      (theOtherPlayer.yVelocity > -1 ||
                        Math.abs(copyball.x - GROUND_HALF_WIDTH) > 72)
                    ) {
                      continue;
                    }
                    if (
                      samesideloss(
                        theOtherPlayer,
                        predict[predict.length - 1].x
                      ) &&
                      (predict.length < shortPath ||
                        (predict.length === shortPath && rand() % 2 < 1))
                    ) {
                      shortPath = predict.length;
                      player.goodtime = frame;
                      player.attackX = copyball.x;
                      player.direction = direct;
                      userInput.yDirection = -1;
                      // console.log((player.isPlayer2 ? '2' : '1') + ':normal');
                    }
                  }
                }
              }
            }
          }
        }
        // console.log('goodtime' + player.goodtime);
        // console.log('dict' + player.direction);
        // console.log('shortX' + ball.shortX);
      }

      if (
        !thunder_defense &&
        player.state === 0 &&
        player.goodtime < 0 &&
        ball.path.length < 12 &&
        Math.abs(player.x - ball.expectedLandingPointX) >
          ball.path.length * 6 + PLAYER_HALF_LENGTH
      ) {
        diving = true;
      }

      if (player.goodtime > -1) {
        virtualExpectedLandingPointX = player.attackX;
      }
      if (player.secondattack > -1 && player.goodtime < 0) {
        virtualExpectedLandingPointX = player.secondX;
      }
    }
    // move
    if (Math.abs(player.x - virtualExpectedLandingPointX) > 3) {
      if (player.x < virtualExpectedLandingPointX) {
        userInput.xDirection = 1;
      } else {
        userInput.xDirection = -1;
      }
    }
    // diving
    if (diving) {
      userInput.powerHit = 1;
      diving = false;
    }
    // attack
    if (player.goodtime === 0 || player.secondattack === 0) {
      userInput.powerHit = 1;
      if (!player.freestyle) {
        // 打最遠
        const attackFar = rand() % 10 < 2;
        // console.log(attackFar);
        if (attackFar) {
          let far_diff = 0;
          const copyball = ball.path[0];
          for (let direct = 0; direct < 6; direct++) {
            if (player.direction === direct) {
              continue;
            }
            const predict = copyball.predict[direct];
            if (
              samesideloss(theOtherPlayer, predict[predict.length - 1].x) &&
              Math.abs(theOtherPlayer.x - predict[predict.length - 1].x) >=
                far_diff
            ) {
              far_diff = Math.abs(
                theOtherPlayer.x - predict[predict.length - 1].x
              );
              player.direction = direct;
            }
          }
        }

        // anti block
        // console.log(
        //   (theOtherPlayer.isPlayer2 ? '2 ' : '1 ') +
        //     (Math.abs(theOtherPlayer.x - GROUND_HALF_WIDTH) -
        //       PLAYER_HALF_LENGTH)
        // );
        if (
          Math.abs(theOtherPlayer.x - GROUND_HALF_WIDTH) <
            PLAYER_HALF_LENGTH + 61 &&
          theOtherPlayer.state < 3 &&
          player.yVelocity < 12
        ) {
          // console.log('anti block');
          // console.log(player.isPlayer2);
          let canbypass = false;
          const copyball = ball.path[0];
          let short_path = 1000;
          // noraml
          if (theOtherPlayer.state === 0 || theOtherPlayer.yVelocity > 12) {
            if (
              canblockPredict(
                theOtherPlayer,
                copyball.predict[player.direction]
              )
            ) {
              for (let direct = 0; direct < 6; direct++) {
                const predict = copyball.predict[direct];
                if (
                  samesideloss(theOtherPlayer, predict[predict.length - 1].x) &&
                  predict.length <= short_path &&
                  !canblockPredict(theOtherPlayer, predict)
                ) {
                  short_path = predict.length;
                  player.direction = direct;
                  canbypass = true;
                }
              }
            } else {
              canbypass = true;
            }
          } else {
            // jump
            if (canblock(theOtherPlayer, copyball.predict[player.direction])) {
              for (let direct = 0; direct < 6; direct++) {
                const predict = copyball.predict[direct];
                if (
                  samesideloss(theOtherPlayer, predict[predict.length - 1].x) &&
                  predict.length <= short_path &&
                  !canblock(theOtherPlayer, predict)
                ) {
                  short_path = predict.length;
                  player.direction = direct;
                  canbypass = true;
                }
              }
            } else {
              canbypass = true;
            }
          }

          if (!canbypass) {
            userInput.powerHit = 0;
          }
        }
      } else {
        player.freestyle = false;
      }
      if (player.secondattack === 0) {
        var shortPath = 1000;
        const copyball = ball.path[0];

        // freestyle
        for (let direct = 1; direct < 6; direct++) {
          const predict = copyball.predict[direct];
          for (
            let predictframe = 1;
            predictframe < predict.length - 1;
            predictframe++
          ) {
            const predictball = predict[predictframe];
            if (sameside(theOtherPlayer, predictball.x)) {
              break;
            }
            if (
              Math.abs(
                predictball.y - playerYpredict(player, predictframe + 1)
              ) <= PLAYER_HALF_LENGTH &&
              Math.abs(
                predict[predictframe - 1].y -
                  playerYpredict(player, predictframe)
              ) > PLAYER_HALF_LENGTH &&
              Math.abs(predictball.x - player.x) <=
                6 * predictframe + PLAYER_HALF_LENGTH
            ) {
              shortPath = -1;
              player.goodtime = 0;
              player.attackX = predictball.x;
              player.direction = direct;
              player.freestyle = true;
              player.secondX =
                predictball.x +
                (player.isPlayer2
                  ? -PLAYER_HALF_LENGTH + 9
                  : PLAYER_HALF_LENGTH - 9);
              player.secondattack = predictframe + 1;
              break;
            }
          }
        }

        // normal
        if (shortPath > -1) {
          for (let direct = 2; direct < 6; direct++) {
            const predict = copyball.predict[direct];
            if (
              samesideloss(theOtherPlayer, predict[predict.length - 1].x) &&
              predict.length < shortPath
            ) {
              shortPath = predict.length;
              player.goodtime = 0;
              player.attackX = copyball.x;
              player.direction = direct;
            }
          }
        }
      }
      // console.log((player.isPlayer2 ? '2' : '1') + ':hit');
      // console.log(ball.path[0]);
      // console.log(ball.path[0].predict[player.direction]);
      // console.log(ball);
      if (player.direction === 0) {
        userInput.yDirection = -1;
        userInput.xDirection = 0;
      }
      if (player.direction === 1) {
        userInput.yDirection = -1;
        userInput.xDirection = userInput.xDirection === 1 ? 1 : -1;
      }
      if (player.direction === 2) {
        userInput.yDirection = 0;
        userInput.xDirection = 0;
      }
      if (player.direction === 3) {
        userInput.yDirection = 0;
        userInput.xDirection = userInput.xDirection === 1 ? 1 : -1;
      }
      if (player.direction === 4) {
        userInput.yDirection = 1;
        userInput.xDirection = 0;
      }
      if (player.direction === 5) {
        userInput.yDirection = 1;
        userInput.xDirection = userInput.xDirection === 1 ? 1 : -1;
      }
    }
    player.goodtime -= 1;
    player.secondattack -= 1;
  }
  // if (player.tactics === 1) {
  //   // console.log('frame: ' + ball.frame);
  //   // console.log('xVelocity: ' + ball.xVelocity);
  //   // console.log('yVelocity: ' + ball.yVelocity);
  //   // 防偷襲
  //   if (
  //     (sameside(player, ball.expectedLandingPointX) &&
  //       sameside(player, ball.x)) ||
  //     (player.isPlayer2 &&
  //       ball.xVelocity === 10 &&
  //       ball.yVelocity < -25 &&
  //       ball.x !== 204 &&
  //       ball.y !== 144)
  //   ) {
  //     player.tactics = 0;
  //   }
  //   if (ball.frame < 40) {
  //     userInput.xDirection = 1;
  //   }
  //   if (ball.frame === 40) {
  //     userInput.xDirection = -1;
  //   }
  //   // 3. Head thunder(fake, flat) 52
  //   // 1. Break net(fake, flat) 54
  //   // 5. Net thunder(fake, flat) 72
  //   // Net G smash 72
  //   if (
  //     ball.xVelocity === (player.isPlayer2 ? 20 : -20) &&
  //     ball.yVelocity === 1
  //   ) {
  //     player.tactics = 0;
  //     userInput.xDirection = -1;
  //     if (player.isPlayer2 && ball.y > 100) {
  //       userInput.yDirection = -1;
  //     }
  //   }
  //   // 0. Break net 52
  //   if (
  //     ball.xVelocity === (player.isPlayer2 ? 20 : -20) &&
  //     ball.yVelocity === 35
  //   ) {
  //     player.tactics = 0;
  //     userInput.xDirection = 1;
  //   }
  //   // 2. Head thunder 52
  //   if (
  //     ball.xVelocity === (player.isPlayer2 ? 20 : -20) &&
  //     ball.yVelocity === 65
  //   ) {
  //     player.tactics = 0;
  //     userInput.xDirection = 1;
  //     userInput.yDirection = -1;
  //   }
  //   // 左邊彈網
  //   if (ball.expectedLandingPointX === 392) {
  //     player.tactics = 4;
  //   }
  //   // 右邊彈網不打
  //   if (ball.frame === 73 && ball.xVelocity === -20 && ball.yVelocity === 14) {
  //     userInput.xDirection = -1;
  //     player.tactics = 0;
  //   }
  //   // net thunder
  //   if (ball.xVelocity === -10 && ball.yVelocity === 65) {
  //     userInput.xDirection = 1;
  //     userInput.yDirection = -1;
  //     player.tactics = 0;
  //   }
  //   if (player.isPlayer2) {
  //     userInput.xDirection = -userInput.xDirection;
  //   }
  // }
  // if (player.tactics === 2) {
  //   // console.log(ball.frame);
  //   // console.log(ball.xVelocity);
  //   // console.log(ball.yVelocity);
  //   // console.log(ball);
  //   if (
  //     (sameside(player, ball.expectedLandingPointX) &&
  //       sameside(player, ball.x)) ||
  //     (player.isPlayer2 &&
  //       ball.xVelocity === 10 &&
  //       ball.yVelocity < -25 &&
  //       ball.x !== 215 &&
  //       ball.y !== 144)
  //   ) {
  //     player.tactics = 0;
  //   }
  //   if (ball.frame < 53) {
  //     userInput.xDirection = 1;
  //   }
  //   // 7. Tail thunder(fake, flat) 48
  //   if (
  //     ball.xVelocity === (player.isPlayer2 ? 20 : -20) &&
  //     ball.yVelocity === 1
  //   ) {
  //     player.tactics = 0;
  //     userInput.xDirection = -1;
  //   }
  //   // 6. Tail thunder 52
  //   if (
  //     ball.xVelocity === (player.isPlayer2 ? 10 : -20) &&
  //     ball.yVelocity === 65
  //   ) {
  //     player.tactics = 0;
  //     userInput.yDirection = -1;
  //   }
  //   if (player.isPlayer2) {
  //     userInput.xDirection = -userInput.xDirection;
  //   }
  //   if (ball.frame > 53) {
  //     player.tactics = 0;
  //   }
  // }
  if (player.tactics === 3) {
    player.serve.executeMove(player, ball, theOtherPlayer, userInput);
    if (player.serve.framesLeft < -1000) {
      player.tactics = 0;
    }
  }
  // if (player.tactics === 4) {
  //   // 左邊彈網
  //   if (ball.frame < 66) {
  //     userInput.xDirection = 1;
  //   }
  //   if (ball.frame === 73) {
  //     // 4. Net V smash
  //     if (ball.xVelocity === 10 && ball.yVelocity === 31) {
  //       userInput.xDirection = -1;
  //     } else {
  //       userInput.xDirection = 1;
  //     }
  //     player.tactics = 0;
  //   }
  // }
}

// /**
//  * FUN_00402360
//  * Computer controls its player by this function.
//  * Computer decides the user input for the player it controls,
//  * according to the game situation it figures out
//  * by the given parameters (player, ball and theOtherplayer),
//  * and reflects these to the given user input object.
//  *
//  * @param {Player} player The player whom computer contorls
//  * @param {Ball} ball ball
//  * @param {Player} theOtherPlayer The other player
//  * @param {PikaUserInput} userInput user input of the player whom computer controls
//  */
// function letComputerDecideUserInput(player, ball, theOtherPlayer, userInput) {
//   userInput.xDirection = 0;
//   userInput.yDirection = 0;
//   userInput.powerHit = 0;

//   let virtualExpectedLandingPointX = ball.expectedLandingPointX;
//   if (
//     Math.abs(ball.x - player.x) > 100 &&
//     Math.abs(ball.xVelocity) < player.computerBoldness + 5
//   ) {
//     const leftBoundary = Number(player.isPlayer2) * GROUND_HALF_WIDTH;
//     if (
//       (ball.expectedLandingPointX <= leftBoundary ||
//         ball.expectedLandingPointX >=
//           Number(player.isPlayer2) * GROUND_WIDTH + GROUND_HALF_WIDTH) &&
//       player.computerWhereToStandBy === 0
//     ) {
//       // If conditions above met, the computer estimates the proper location to stay as the middle point of their side
//       virtualExpectedLandingPointX =
//         leftBoundary + ((GROUND_HALF_WIDTH / 2) | 0);
//     }
//   }

//   if (
//     Math.abs(virtualExpectedLandingPointX - player.x) >
//     player.computerBoldness + 8
//   ) {
//     if (player.x < virtualExpectedLandingPointX) {
//       userInput.xDirection = 1;
//     } else {
//       userInput.xDirection = -1;
//     }
//   } else if (rand() % 20 === 0) {
//     player.computerWhereToStandBy = rand() % 2;
//   }

//   if (player.state === 0) {
//     if (
//       Math.abs(ball.xVelocity) < player.computerBoldness + 3 &&
//       Math.abs(ball.x - player.x) < PLAYER_HALF_LENGTH &&
//       ball.y > -36 &&
//       ball.y < 10 * player.computerBoldness + 84 &&
//       ball.yVelocity > 0
//     ) {
//       userInput.yDirection = -1;
//     }

//     const leftBoundary = Number(player.isPlayer2) * GROUND_HALF_WIDTH;
//     const rightBoundary = (Number(player.isPlayer2) + 1) * GROUND_HALF_WIDTH;
//     if (
//       ball.expectedLandingPointX > leftBoundary &&
//       ball.expectedLandingPointX < rightBoundary &&
//       Math.abs(ball.x - player.x) >
//         player.computerBoldness * 5 + PLAYER_LENGTH &&
//       ball.x > leftBoundary &&
//       ball.x < rightBoundary &&
//       ball.y > 174
//     ) {
//       // If conditions above met, the computer decides to dive!
//       userInput.powerHit = 1;
//       if (player.x < ball.x) {
//         userInput.xDirection = 1;
//       } else {
//         userInput.xDirection = -1;
//       }
//     }
//   } else if (player.state === 1 || player.state === 2) {
//     if (Math.abs(ball.x - player.x) > 8) {
//       if (player.x < ball.x) {
//         userInput.xDirection = 1;
//       } else {
//         userInput.xDirection = -1;
//       }
//     }
//     if (Math.abs(ball.x - player.x) < 48 && Math.abs(ball.y - player.y) < 48) {
//       const willInputPowerHit = decideWhetherInputPowerHit(
//         player,
//         ball,
//         theOtherPlayer,
//         userInput
//       );
//       if (willInputPowerHit === true) {
//         userInput.powerHit = 1;
//         if (
//           Math.abs(theOtherPlayer.x - player.x) < 80 &&
//           userInput.yDirection !== -1
//         ) {
//           userInput.yDirection = -1;
//         }
//       }
//     }
//   }
// }

// /**
//  * FUN_00402630
//  * This function is called by {@link letComputerDecideUserInput},
//  * and also sets x and y direction user input so that it participate in
//  * the decision of the direction of power hit.
//  * @param {Player} player the player whom computer controls
//  * @param {Ball} ball ball
//  * @param {Player} theOtherPlayer The other player
//  * @param {PikaUserInput} userInput user input for the player whom computer controls
//  * @return {boolean} Will input power hit?
//  */
// function decideWhetherInputPowerHit(player, ball, theOtherPlayer, userInput) {
//   if (rand() % 2 === 0) {
//     for (let xDirection = 1; xDirection > -1; xDirection--) {
//       for (let yDirection = -1; yDirection < 2; yDirection++) {
//         const expectedLandingPointX = expectedLandingPointXWhenPowerHit(
//           xDirection,
//           yDirection,
//           ball
//         );
//         if (
//           (expectedLandingPointX <=
//             Number(player.isPlayer2) * GROUND_HALF_WIDTH ||
//             expectedLandingPointX >=
//               Number(player.isPlayer2) * GROUND_WIDTH + GROUND_HALF_WIDTH) &&
//           Math.abs(expectedLandingPointX - theOtherPlayer.x) > PLAYER_LENGTH
//         ) {
//           userInput.xDirection = xDirection;
//           userInput.yDirection = yDirection;
//           return true;
//         }
//       }
//     }
//   } else {
//     for (let xDirection = 1; xDirection > -1; xDirection--) {
//       for (let yDirection = 1; yDirection > -2; yDirection--) {
//         const expectedLandingPointX = expectedLandingPointXWhenPowerHit(
//           xDirection,
//           yDirection,
//           ball
//         );
//         if (
//           (expectedLandingPointX <=
//             Number(player.isPlayer2) * GROUND_HALF_WIDTH ||
//             expectedLandingPointX >=
//               Number(player.isPlayer2) * GROUND_WIDTH + GROUND_HALF_WIDTH) &&
//           Math.abs(expectedLandingPointX - theOtherPlayer.x) > PLAYER_LENGTH
//         ) {
//           userInput.xDirection = xDirection;
//           userInput.yDirection = yDirection;
//           return true;
//         }
//       }
//     }
//   }
//   return false;
// }

// /**
//  * FUN_00402870
//  * This function is called by {@link decideWhetherInputPowerHit},
//  * and calculates the expected x coordinate of the landing point of the ball
//  * when power hit
//  * @param {PikaUserInput["xDirection"]} userInputXDirection
//  * @param {PikaUserInput["yDirection"]} userInputYDirection
//  * @param {Ball} ball
//  * @return {number} x coord of expected landing point when power hit the ball
//  */
// function expectedLandingPointXWhenPowerHit(
//   userInputXDirection,
//   userInputYDirection,
//   ball
// ) {
//   const copyBall = {
//     x: ball.x,
//     y: ball.y,
//     xVelocity: ball.xVelocity,
//     yVelocity: ball.yVelocity,
//   };
//   if (copyBall.x < GROUND_HALF_WIDTH) {
//     copyBall.xVelocity = (Math.abs(userInputXDirection) + 1) * 10;
//   } else {
//     copyBall.xVelocity = -(Math.abs(userInputXDirection) + 1) * 10;
//   }
//   copyBall.yVelocity = Math.abs(copyBall.yVelocity) * userInputYDirection * 2;

//   let loopCounter = 0;
//   while (true) {
//     loopCounter++;

//     const futureCopyBallX = copyBall.x + copyBall.xVelocity;
//     if (futureCopyBallX < BALL_RADIUS || futureCopyBallX > GROUND_WIDTH) {
//       copyBall.xVelocity = -copyBall.xVelocity;
//     }
//     if (copyBall.y + copyBall.yVelocity < 0) {
//       copyBall.yVelocity = 1;
//     }
//     if (
//       Math.abs(copyBall.x - GROUND_HALF_WIDTH) < NET_PILLAR_HALF_WIDTH &&
//       copyBall.y > NET_PILLAR_TOP_TOP_Y_COORD
//     ) {
//       /*
//         The code below maybe is intended to make computer do mistakes.
//         The player controlled by computer occasionally power hit ball that is bounced back by the net pillar,
//         since code below do not anticipate the bounce back.
//       */
//       if (copyBall.yVelocity > 0) {
//         copyBall.yVelocity = -copyBall.yVelocity;
//       }
//       /*
//       An alternative code for making the computer not do those mistakes is as below.

//       if (copyBall.y <= NET_PILLAR_TOP_BOTTOM_Y_COORD) {
//         if (copyBall.yVelocity > 0) {
//           copyBall.yVelocity = -copyBall.yVelocity;
//         }
//       } else {
//         if (copyBall.x < GROUND_HALF_WIDTH) {
//           copyBall.xVelocity = -Math.abs(copyBall.xVelocity);
//         } else {
//           copyBall.xVelocity = Math.abs(copyBall.xVelocity);
//         }
//       }
//       */
//     }
//     copyBall.y = copyBall.y + copyBall.yVelocity;
//     if (
//       copyBall.y > BALL_TOUCHING_GROUND_Y_COORD ||
//       loopCounter >= INFINITE_LOOP_LIMIT
//     ) {
//       return copyBall.x;
//     }
//     copyBall.x = copyBall.x + copyBall.xVelocity;
//     copyBall.yVelocity += 1;
//   }
// }
const serveModeT = {
  randomOrder: 0,
  fixedOrder: 1,
  completeRandom: 2,
};
const actionType = {
  wait: 0,
  forward: 1,
  forwardUp: 2,
  up: 3,
  backwardUp: 4,
  backward: 5,
  backwardDown: 6,
  down: 7,
  forwardDown: 8,
  forwardSmash: 9,
  forwardUpSmash: 10,
  upSmash: 11,
  backwardUpSmash: 12,
  backwardSmash: 13,
  backwardDownSmash: 14,
  downSmash: 15,
  forwardDownSmash: 16,
};
// const fullSkillTypeForPlayer1 = {
//   breakNet: 0,
//   tossAndFlat: 1,
//   headThunder: 2,
//   fakeHeadThunderFlat: 3,
//   netVSmash: 4,
//   netRSmash: 5,
//   netGSmash: 6,
//   netDodge: 7,
//   tailThunder: 8,
//   fakeTailThunderFlat: 9,
// };
// const fullSkillTypeForPlayer2 = {
//   breakNet: 0,
//   tossAndFlat: 1,
//   headThunder: 2,
//   fakeHeadThunderFlat: 3,
//   netThunder: 4,
//   fakeNetThunderFlat: 5,
// };
const player1Formula = [
  [
    // 0. Break net
    { action: actionType.forward, frames: 1 },
    { action: actionType.wait, frames: 20 },
    { action: actionType.forward, frames: 26 },
    { action: actionType.forwardUp, frames: 4 },
    { action: actionType.forwardDownSmash, frames: 1 },
  ],
  [
    // 1. Break net(fake, flat)
    { action: actionType.forward, frames: 1 },
    { action: actionType.wait, frames: 20 },
    { action: actionType.forward, frames: 30 },
    { action: actionType.forwardUp, frames: 1 },
    { action: actionType.forwardSmash, frames: 2 },
  ],
  [
    // 2. Head thunder
    { action: actionType.forward, frames: 1 },
    { action: actionType.wait, frames: 20 },
    { action: actionType.forward, frames: 11 },
    { action: actionType.forwardUp, frames: 15 },
    { action: actionType.downSmash, frames: 1 },
    { action: actionType.forwardDownSmash, frames: 4 },
  ],
  [
    // 3. Head thunder(fake, flat)
    { action: actionType.forward, frames: 1 },
    { action: actionType.wait, frames: 20 },
    { action: actionType.forward, frames: 11 },
    { action: actionType.forwardUp, frames: 15 },
    { action: actionType.forwardSmash, frames: 1 },
  ],
  [
    // 4. Net V smash
    { action: actionType.forward, frames: 1 },
    { action: actionType.wait, frames: 20 },
    { action: actionType.forward, frames: 31 },
    { action: actionType.forwardUpSmash, frames: 3 },
    { action: actionType.wait, frames: 16 },
    { action: actionType.downSmash, frames: 5 },
  ],
  [
    // 5. Net R smash
    { action: actionType.forward, frames: 1 },
    { action: actionType.wait, frames: 20 },
    { action: actionType.forward, frames: 31 },
    { action: actionType.forwardUpSmash, frames: 3 },
    { action: actionType.wait, frames: 16 },
    { action: actionType.upSmash, frames: 1 },
  ],
  [
    // 6. Net G smash
    { action: actionType.forward, frames: 1 },
    { action: actionType.wait, frames: 20 },
    { action: actionType.forward, frames: 31 },
    { action: actionType.forwardUpSmash, frames: 3 },
    { action: actionType.wait, frames: 16 },
    { action: actionType.forwardSmash, frames: 1 },
  ],
  [
    // 7. Net dodge
    { action: actionType.forward, frames: 1 },
    { action: actionType.wait, frames: 20 },
    { action: actionType.forward, frames: 31 },
    { action: actionType.forwardUpSmash, frames: 3 },
    { action: actionType.wait, frames: 16 },
    { action: actionType.backward, frames: 1 },
  ],
  [
    // 8. Tail thunder
    { action: actionType.forward, frames: 7 },
    { action: actionType.wait, frames: 14 },
    { action: actionType.forward, frames: 11 },
    { action: actionType.forwardUp, frames: 15 },
    { action: actionType.downSmash, frames: 5 },
  ],
  [
    // 9. Tail thunder(fake, flat)
    { action: actionType.forward, frames: 7 },
    { action: actionType.wait, frames: 14 },
    { action: actionType.forward, frames: 11 },
    { action: actionType.forwardUp, frames: 15 },
    { action: actionType.forwardSmash, frames: 1 },
  ],
];
const player2Formula = [
  player1Formula[0].slice(), // 0. Break net
  player1Formula[1].slice(), // 1. Break net(fake, flat)
  player1Formula[2].slice(), // 2. Head thunder
  player1Formula[3].slice(), // 3. Head thunder(fake, flat)
  player1Formula[4].slice(), // 4. Net thunder
  player1Formula[6].slice(), // 5. Net thunder(fake, flat)
  [
    // 6. Tail thunder
    { action: actionType.forward, frames: 7 },
    { action: actionType.wait, frames: 14 },
    { action: actionType.forward, frames: 11 },
    { action: actionType.forwardUp, frames: 2 },
    { action: actionType.wait, frames: 13 },
    { action: actionType.forwardDownSmash, frames: 5 },
  ],
  [
    // 7. Tail thunder(fake, flat)
    { action: actionType.forward, frames: 7 },
    { action: actionType.wait, frames: 14 },
    { action: actionType.forward, frames: 11 },
    { action: actionType.forwardUp, frames: 2 },
    { action: actionType.wait, frames: 13 },
    { action: actionType.forwardSmash, frames: 1 },
  ],
];
class ServeMachine {
  constructor(isPlayer2) {
    this.isPlayer2 = isPlayer2;

    if (isPlayer2 === false) this.skillCount = 10;
    else if (isPlayer2 === true) this.skillCount = 8;
    this.randServeIndex = this.skillCount - 1;
    this.skillList = [...Array(this.skillCount).keys()];
    this.usingFullSkill = -1;
    // console.log(this.skillList);
  }
  shuffle() {
    for (let i = this.skillCount - 1; i >= 0; i--) {
      var randomIndex = Math.floor(Math.random() * (i + 1));
      // swap
      const temp = this.skillList[randomIndex];
      this.skillList[randomIndex] = this.skillList[i];
      this.skillList[i] = temp;
    }
    this.randServeIndex = 0;
  }
  chooseNextSkill() {
    if (serveMode === serveModeT.randomOrder)
      while (1) {
        // get next
        this.usingFullSkill = this.skillList[this.randServeIndex];
        this.randServeIndex++;
        // if (this.randServeIndex === this.skillCount)
        this.shuffle();
        // check if it's available
        if (
          this.isPlayer2 === false &&
          SkillTypeForPlayer1Available[this.usingFullSkill] === true
        )
          return;
        else if (
          this.isPlayer2 === true &&
          SkillTypeForPlayer2Available[this.usingFullSkill] === true
        )
          return;
      }
    else if (serveMode === serveModeT.fixedOrder)
      while (1) {
        // get next
        this.usingFullSkill++;
        if (this.usingFullSkill === this.skillCount) this.usingFullSkill = 0;
        // check if it's available
        if (
          this.isPlayer2 === false &&
          SkillTypeForPlayer1Available[this.usingFullSkill] === true
        )
          return;
        else if (
          this.isPlayer2 === true &&
          SkillTypeForPlayer2Available[this.usingFullSkill] === true
        )
          return;
      }
  }
  initializeForNewRound() {
    this.chooseNextSkill();
    this.framesLeft = 0;
    this.phase = 0;
  }
  executeMove(player, ball, theOtherPlayer, userInput) {
    // move
    this.getNextAction();
    this.framesLeft--;
    if (this.action === actionType.forward) {
      userInput.xDirection = 1;
    } else if (this.action === actionType.forwardUp) {
      userInput.xDirection = 1;
      userInput.yDirection = -1;
    } else if (this.action === actionType.forwardDownSmash) {
      userInput.xDirection = 1;
      userInput.yDirection = 1;
      userInput.powerHit = 1;
    } else if (this.action === actionType.forwardSmash) {
      userInput.xDirection = 1;
      userInput.powerHit = 1;
    } else if (this.action === actionType.downSmash) {
      userInput.yDirection = 1;
      userInput.powerHit = 1;
    } else if (this.action === actionType.upSmash) {
      userInput.yDirection = -1;
      userInput.powerHit = 1;
    } else if (this.action === actionType.forwardUpSmash) {
      userInput.xDirection = 1;
      userInput.yDirection = -1;
      userInput.powerHit = 1;
    } else if (this.action === actionType.backward) {
      userInput.xDirection = -1;
    }
    // console.log(this.action);
    if (this.isPlayer2 === true) {
      userInput.xDirection = -userInput.xDirection;
    }
    return;
  }
  getNextAction() {
    if (this.framesLeft === 0) {
      // check formula
      if (this.isPlayer2 === false) {
        if (this.phase < player1Formula[this.usingFullSkill].length) {
          this.action = player1Formula[this.usingFullSkill][this.phase].action;
          this.framesLeft =
            player1Formula[this.usingFullSkill][this.phase].frames;
        } else {
          // don't move
          this.action = actionType.wait;
          this.framesLeft = -1000;
        }
      } else if (this.isPlayer2 === true) {
        if (this.phase < player2Formula[this.usingFullSkill].length) {
          this.action = player2Formula[this.usingFullSkill][this.phase].action;
          this.framesLeft =
            player2Formula[this.usingFullSkill][this.phase].frames;
        } else {
          // don't move
          this.action = actionType.wait;
          this.framesLeft = -1000;
        }
      }
      this.phase++;
    }

    if (this.framesLeft === 0) {
      this.getNextAction();
    }
  }
}
