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
  is_player2: false, // 0xA0
  is_computer: false, // 0xA4
  x: 0, // 0xA8
  y: 0, // 0xAC
  velocity_y: 0, // 0xB0
  status: 0, // 0xC0 // 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving, 4: lying_down_after_diving
  diving_direction: 0,  // 0xB4
  lying_down_duration_left: -1  // 0xB8
};

// player on right side
const player2 = {
  is_player2: true, // 0xA0
  is_computer: false, // 0xA4
  x: 0, // 0xA8
  y: 0, // 0xAC
  velocity_y: 0, // 0xB0
  status: 0, // 0xC0 // 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving, 4: lying_down_after_diving
  diving_direction: 0,  // 0xB4
  lying_down_duration_left: -1 // 0xB8
};

const ball = {
  x: 0, // 0x30
  y: 0, // 0x34
  velocity_x: 0, // 0x38
  velocity_y: 0, // 0x3C
  expected_landing_point_x: 40000, // 0x40
  is_power_hit: false // 0x68
};

// FUN_00402dc0
function process_ball_world_collision(ball) {
  let iVar2 = ball.velocity_xl;
  let iVar5 = iVar2 / 2 + ball.x48;
  ball.x48 = iVar5;
  if (iVar5 < 0) {
    iVar5 += 50;
  } else if (iVar5 > 50) {
    iVar5 += -50;
  }
  ball.x48 = iVar5;

  ball.x44 = ((ball.x48 / 10) >> 0);  // integer division

  const future_ball_x = ball.x + ball.velocity_x;
  // If the center of ball would get out of left world bound or right world bound
  //
  // TODO:
  // future_ball_x > 432 should be changed to future_ball_x > (432 - 20)
  // [maybe upper one is more possible when seeing pikachu player's x-direction boundary]
  // or, future_ball_x < 20 should be changed to future_ball_x < 0
  // I think this is a mistake of the author of the original game.
  if (future_ball_x < 20 || future_ball_x > 432) {
    ball.velocity_x = -ball.velocity_x;
  }

  let future_ball_y = ball.y + ball.velocity_y;
  // if the center of ball would get out of upper world bound
  if (future_ball_y < 0) {
    ball.velocity_y = 1;
  }

  // If ball touches net
  if (Math.abs(ball.x - 216) < 25 && ball.y > 176) {
    if (ball.y < 193) {
      if (ball.velocity_y > 0) {
        ball.velocity_y = -ball.velocity_y;
      }
    } else {
      if (ball_x < 216) {
        ball.velocity_x = -Math.abs(ball.velocity_x);
      } else {
        ball.velocity_x = Math.abs(ball.velocity_x);
      }
    }
  }

  future_ball_y = ball.y + ball.velocity_y;
  // if ball would touch ground
  if (future_ball_y > 252) {
    // TODO: many many other
    //FUN_0048470
    //SOUND?
    ball.velocity_y = -ball.velocity_y;
    ball.x50 = ball.x;
    ball.y = 252;
    ball.x4c = 20;
    ball.x54 = 272;
    return 1;
  }
  ball.y = future_ball_y;
  ball.x = ball.x + ball.velocity_x;
  ball.velocity_y += 1;

  return 0;
}

// FUN_004030a0
function process_ball_pika_collision(
  ball,
  param_1,
  param_2,
  param_3,
  param_4,
  param_5
) {
  // param_1 is maybe pika's x position
  // if collision occur,
  // greater the x position difference between pika and ball,
  // greater the x velocity of the ball.
  if (ball.x < param_1) {
    // Since javascript division is float division by default
    // I use "Math.floor" to do integer division
    ball.velocity_x = -Math.floor(Math.abs(ball.x - param_1) / 3);
  } else if (ball.x > param_1) {
    ball.velocity_x = Math.floor(Math.abs(ball.x - param_1) / 3);
  }

  // If ball velocity x is 0, randomly choose one of -1, 0, 1.
  if (ball.velocity_x === 0) {
    // the original source code use "_rand()" function
    // I could't figure out how this function works exactly.
    // But, anyhow, it should be a funtion that generate a random number.
    ball.velocity_x = Math.floor(3 * Math.random()) - 1;
  }

  const ball_abs_velocity_y = Math.abs(ball.velocity_y);
  ball.velocity_y = -ball_abs_velocity_y;

  if (ball_abs_velocity_y < 15) {
    ball.velocity_y = -15;
  }

  // if power hit key down
  if (param_5 === 2) {
    // TODO: manymany other
    let iVar1 = ball.x;
    if (ball.x < 216) {
      ball.velocity_x = (Math.abs(param_3) + 1) * 10;
    } else {
      ball.velocity_x = -(Math.abs(param_3) + 1) * 10;
    }
    ball.velocity_y = Math.abs(ball.velocity_y) * param_4 * 2;
    ball.is_power_hit = true;
  } else {
    ball.is_power_hit = false;
  }

  // TODO: here call function which expect landing point x of ball
  // FUN_004031b0

  return 1;
}

function Fun_00403dd0() {
  let uVar4 = 0;
  let ppvVar7 = pp_to_p1;
  let local_20 = process_ball_world_collision(p_to_ball);
  let local_3c = pram_1;
  let ppvVar6 = ppvVar7;
  let local_14 = ball;
  let local_lc_0 = player_2;
  let local_lc_1 = player_1;

  for (let i = 0; i < 2; i++) {
    FUN_004031b0();
    process_player_movement(player, keyboard, the_other_player, ball);
  }
}

// FUN_00401fc0
// param1_array maybe keyboard (if param_1[1] === -1, up_key downed)
// param1[0] === -1: left key downed, param1[0] === 1: right key downed.
// param1[0] === 0: left/right key not downed.
function process_player_movement(player, keyboard, the_other_player, ball) {
  if (player === null || ball === null) {
    return 0;
  }
  
  if (player.is_computer === true) {
    // maybe computer ai function?
    FUN_00402460(player, ball, the_other_player, keyboard);
  }

  // if player is lying down..
  if (player.status === 4) {
    player.lying_down_duration_left += -1;
    if (player.lying_down_duration_left < -1) {
      player.status = 0;
    }
    return 1;
  }
  
  // process x-direction movement
  let player_velocity_x = 0;
  if (player.status < 5) {
    if (player.status < 3) {
      if (keyboard.left_key_downed === true) {
        player_velocity_x = -6;
      } else if (keyboard.right_key_downed === true) {
        player_velocity_x = 6;
      }
    } else {  // if player is diving..
      player_velocity_x = player.diving_direction * 8;
    }
  }

  let future_player_x = player.x + player_velocity_x;
  player.x = future_player_x;

  // process player's x-direction world boundary
  if (player.is_player2 === false) {  // if player is player1
    if (future_player_x < 32) {
      player.x = 32;
    } else if (future_player_x > 216 - 32) {
      player.x = 216 - 32;
    }
  } else {  // if player is player2
    if (future_player_x < 216 + 32) {
      player.x = 216 + 32;
    } else if (future_player_x > 432 - 32) {
      player.x = 432 - 32;
    }
  }

  // jump
  // player.y == 244 means player is touching ground
  if (player.status < 3 && keyboard.up_key_downed === true && player.y === 244) {
    player.velocity_y = -16;
    player.status = 1;
    player.c4 = 0;
    //TODO: image function
    //TODO: sound function "chu~"
  }

  // gravity
  let future_player_y = player.y + player.velocity_y;
  player.y = future_player_y;
  if (future_player_y < 244) {
    player.velocity_y += 1;
  } else if (future_player_y > 244) { // if player is landing..
    player.velocity_y = 0;
    player.y = 244;
    player.c4 = 0;
    if (player.status === 3) { // if player is diving..
      player.status = 4;
      player.c4 = 0;
      player.lying_down_duration_left = 3;
    } else {
      player.status = 0;
    }
  }

  if (keyboard.power_hit_key_pressed_this_key_should_not_auto_repeated === true) {
    if (player.status === 1) {
      // if player is jumping..
      // then player do power hit!
      iVar3 = player.x;
      player.cc = 5;
      player.c4 = 0;
      player.status = 2;
      //TODO: sound function "pik~"
      //TODO: image function
      //TODO: sound function "ika!"
      piVar4 = 33333;
    } else if (
      player.status === 0 &&
      (keyboard.left_key_downed === true || keyboard.right_key_downed === true)
    ) {
      // then player do diving!
      player.status = 3;
      player.c4 = 0;
      if (left_key_downed === true) {
        player.diving_direction = -1;
      } else {
        player.diving_direction = +1;
      }
      player.velocity_y = -5;
      //TODO: image function
      //TODO: sound function "chu~"
    }
  }

  if (player.status === 1) {
    player.c4 = (player.c4 + 1) % 3;
  } else {
    if (player.status === 2) {
      if (player.cc < 1) {
        player.c4 += 1;
        if (player.c4 > 4) {
          player.c4 = 0;
          player.status = 1;
        }
      } else {
        player.cc += -1;
      }
    } else if (player.status === 0) {
      player.cc += 1;
      if (player.cc > 3) {
        player.cc = 0;
        temp = player.c4 + player.c8;
        if (temp < 0 || temp > 4) {
          player.c8 = -player.c8;
        }
        player.c4 = player.c4 + player.c8;
      }
    }
  }
  if (player.d4 === 1) {
    if (player.status === 0) {
      if (player.d0 === 1) {
        player.status = 5;
        //TODO: image function
        //TODO: sound function "what?"
      } else {
        player.status === 6;
      }
      player.cc = 0;
      player.c4 = 0;
    }
    FUN_004025e0(player);
  }
  return 1;
}

function FUN_004025e0(player) {
  let iVar1;
  if (player.d4 !== 0 && player.c4 < 4) {
    player.cc += 1;
    if (player.cc > 4) {
      player.cc = 0;
      player.c4 += 1;
    }
    return 1;
  }
  return 0;
}
