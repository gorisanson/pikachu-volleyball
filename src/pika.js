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

  // state
  // 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving
  // 4: lying_down_after_diving
  // 5: win!, 6: lost..
  state: 0, // 0xC0 
  diving_direction: 0, // 0xB4
  lying_down_duration_left: -1, // 0xB8
  is_collision_with_ball_happened: false,  // 0xBC
  frame_number: 0,  // 0xC4
  normal_status_arm_swing_direction: 1,
  delay_before_next_frame: 0, // 0xCC
  is_winner: false, // 0xD0
  game_over: false  // 0xD4
};

// player on right side
const player2 = {
  is_player2: true, // 0xA0
  is_computer: false, // 0xA4
  x: 0, // 0xA8
  y: 0, // 0xAC
  velocity_y: 0, // 0xB0
  
  // state
  // 0: normal, 1: jumping, 2: jumping_and_power_hitting, 3: diving
  // 4: lying_down_after_diving
  // 5: win!, 6: lost..
  state: 0, // 0xC0
  lying_down_duration_left: -1, // 0xB8
  is_collision_with_ball_happened: false,  // 0xBC
  frame_number: 0,  // 0xC4
  normal_status_arm_swing_direction: 1,
  delay_before_next_frame: 0, // 0xCC
  is_winner: false, // 0xD0
  game_over: false  // 0xD4
};

const ball = {
  x: 0, // 0x30
  y: 0, // 0x34
  velocity_x: 0, // 0x38
  velocity_y: 0, // 0x3C
  expected_landing_point_x: 40000, // 0x40
  is_power_hit: false // 0x68
};

const keyboard = {
  x_direction: 0,  // 0: not pressed, -1: left-direction pressed, 1: right-direction pressed
  y_direction: 0,   // 0: not pressed, -1: up-direction pressed, 1: down-direction pressed
  power_hit_key_pressed_this_key_should_not_auto_repeated: false;
}

function physics_function(player1, player2, ball, keyboard) {
  const was_ball_touched_ground = process_collision_between_ball_and_world(p_to_ball);  // p_to_ball: this + 0x14

  let player, the_other_player;
  let local_14 = [0, 0, 0, 0, 0] // array
  let local_lc = [0, 0]; // array
  let local_38 = [0, 0];

  for (let i = 0; i < 2; i++) {
    if (i == 0) {
      player = player1;
      the_other_player = player2;
    } else {
      player = player2;
      the_other_player = player1;
    }
    // TODO: clean up... and don't forget to include calc_expected_x!
    //FUN_00402d90
    copy_ball_info_to_array_and_calc_expected_x(ball, local_14);
    //FUN_00402810
    copy_player_info_to_array(the_other_player, local_lc);
    //FUN_00401fc0
    process_player_movement(player, keyboard, the_other_player, ball);
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
    copy_player_info_to_array(player, local_38);
    const is_happend = is_collision_between_ball_and_player_happened(ball, player.x, player.y);
    if (is_happend === true) {
      if (player.is_collision_with_ball_happened === false) {
        process_collision_between_ball_and_player(ball, player.x, keyboard, player.state);
        player.is_collision_with_ball_happened = true;
      }
    } else {
      player.is_collision_with_ball_happened = false;
    }
  }
  // TODO: what Function is this?
  // TODO: what Function is this?
  return was_ball_touched_ground;
}

// FUN_00402dc0
function process_collision_between_ball_and_world(ball) {
  let iVar2 = ball.velocity_xl;
  let iVar5 = iVar2 / 2 + ball.x48;
  ball.x48 = iVar5;
  if (iVar5 < 0) {
    iVar5 += 50;
  } else if (iVar5 > 50) {
    iVar5 += -50;
  }
  ball.x48 = iVar5;

  ball.x44 = (ball.x48 / 10) >> 0; // integer division

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
    //TODO: FUN_00408470 stereo SOUND (0x28)
    //TODO: SOUND function : ball touch ground sound (0x28 + 0x10)
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
  if (player.state === 4) {
    player.lying_down_duration_left += -1;
    if (player.lying_down_duration_left < -1) {
      player.state = 0;
    }
    return 1;
  }

  // process x-direction movement
  let player_velocity_x = 0;
  if (player.state < 5) {
    if (player.state < 3) {
      player_velocity_x = keyboard.x_direction * 6;
    } else {
      // if player is diving..
      player_velocity_x = player.diving_direction * 8;
    }
  }

  let future_player_x = player.x + player_velocity_x;
  player.x = future_player_x;

  // process player's x-direction world boundary
  if (player.is_player2 === false) {
    // if player is player1
    if (future_player_x < 32) {
      player.x = 32;
    } else if (future_player_x > 216 - 32) {
      player.x = 216 - 32;
    }
  } else {
    // if player is player2
    if (future_player_x < 216 + 32) {
      player.x = 216 + 32;
    } else if (future_player_x > 432 - 32) {
      player.x = 432 - 32;
    }
  }

  // jump
  if (
    player.state < 3 &&
    keyboard.y_direction === -1 &&    // up-key downed
    player.y === 244    // player is touching on the ground
  ) {
    player.velocity_y = -16;
    player.state = 1;
    player.frame_number = 0;
    //TODO: stereo sound function FUN_00408470 (0x90)
    //TODO: sound function "chu~" (0x90 + 0x10)
  }

  // gravity
  let future_player_y = player.y + player.velocity_y;
  player.y = future_player_y;
  if (future_player_y < 244) {
    player.velocity_y += 1;
  } else if (future_player_y > 244) {
    // if player is landing..
    player.velocity_y = 0;
    player.y = 244;
    player.frame_number = 0;
    if (player.state === 3) {
      // if player is diving..
      player.state = 4;
      player.frame_number = 0;
      player.lying_down_duration_left = 3;
    } else {
      player.state = 0;
    }
  }

  if (
    keyboard.power_hit_key_pressed_this_key_should_not_auto_repeated === true
  ) {
    if (player.state === 1) {
      // if player is jumping..
      // then player do power hit!
      iVar3 = player.x;
      player.delay_before_next_frame = 5;
      player.frame_number = 0;
      player.state = 2;
      //TODO: sound function "pik~" (0x90 + 0x18)
      //TODO: stereo sound function FUN_00408470 (0x94)
      //TODO: sound function "ika!" (0x90 + 0x14)
    } else if (
      player.state === 0 &&
      keyboard.x_direction !== 0
    ) {
      // then player do diving!
      player.state = 3;
      player.frame_number = 0;
      if (left_key_downed === true) {
        player.diving_direction = -1;
      } else {
        player.diving_direction = +1;
      }
      player.velocity_y = -5;
      //TODO: stereo sound function FUN_00408470 (0x90)
      //TODO: sound function "chu~" (0x90 + 0x10)
    }
  }

  if (player.state === 1) {
    player.frame_number = (player.frame_number + 1) % 3;
  } else if (player.state === 2) {
    if (player.delay_before_next_frame < 1) {
      player.frame_number += 1;
      if (player.frame_number > 4) {
        player.frame_number = 0;
        player.state = 1;
      }
    } else {
      player.delay_before_next_frame -= 1;
    }
  } else if (player.state === 0) {
    player.delay_before_next_frame += 1;
    if (player.delay_before_next_frame > 3) {
      player.delay_before_next_frame = 0;
      temp = player.frame_number + player.normal_status_arm_swing_direction;
      if (temp < 0 || temp > 4) {
        player.normal_status_arm_swing_direction = -player.normal_status_arm_swing_direction;
      }
      player.frame_number = player.frame_number + player.normal_status_arm_swing_direction;
    }
  }

  if (player.game_over === true) {
    if (player.state === 0) {
      if (player.is_winner === true) {
        player.state = 5;
        //TODO: stereo sound function FUN_00408470 (0x98)
        //TODO: sound function "what?" (0x98 + 0x10) "pik~"?
      } else {
        player.state === 6;
      }
      player.delay_before_next_frame = 0;
      player.frame_number = 0;
    }
    FUN_004025e0(player);
  }
  return 1;
}

// FUN_004030a0
function process_collision_between_ball_and_player(
  ball,
  player_x,
  keyboard,
  player_status
) {
  // player_x is maybe pika's x position
  // if collision occur,
  // greater the x position difference between pika and ball,
  // greater the x velocity of the ball.
  if (ball.x < player_x) {
    // Since javascript division is float division by default
    // I use "Math.floor" to do integer division
    ball.velocity_x = -Math.floor(Math.abs(ball.x - player_x) / 3);
  } else if (ball.x > player_x) {
    ball.velocity_x = Math.floor(Math.abs(ball.x - player_x) / 3);
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
  if (player_status === 2) {
    // if player is jumping and power hitting
    // TODO: manymany other
    if (ball.x < 216) {
      ball.velocity_x = (Math.abs(keyboard.x_direction) + 1) * 10;
    } else {
      ball.velocity_x = -(Math.abs(keyboard.x_direction) + 1) * 10;
    }
    ball.x50 = ball.x;
    ball.x54 = ball.y;

    ball.velocity_y = Math.abs(ball.velocity_y) * keyboard.y_direction * 2;
    ball.x4c = 20;
    // TODO: stereo SOUND FUN_00408470 (0x24)
    // TODO: SOUND power hit sound (0x24 + 0x10)
    ball.is_power_hit = true;
  } else {
    ball.is_power_hit = false;
  }

  // TODO: here call function which expect landing point x of ball
  FUN_004031b0(ball)

  return 1;
}

function FUN_004025e0(player) {
  if (player.game_over === true && player.frame_number < 4) {
    player.delay_before_next_frame += 1;
    if (player.delay_before_next_frame > 4) {
      player.delay_before_next_frame = 0;
      player.frame_number += 1;
    }
    return 1;
  }
  return 0;
}

// FUN_00402d90
function copy_ball_info_to_array_and_calc_expected_x(ball, ball, dest) {
  dest[0] = ball.x;
  dest[1] = ball.y;
  dest[2] = ball.velocity_x;
  dest[3] = ball.velocity_y;
  dest[4] = ball.expected_landing_point_x;
  // TODO: can I extract this FUN below??
  FUN_004031b0(ball); // calculate expected_X;
}

//FUN_00402810
function copy_player_info_to_array(player, dest) {
  dest[0] = player.x;
  dest[1] = player.y;
}

//FUN_00403070
function is_collision_between_ball_and_player_happened(ball, player_x, player_y) {
  let diff = ball.x - player_x;
  if (Math.abs(diff) < 33) {
    diff = ball.y - param_2;
    if (Math.abs(diff) < 33) {
      return true;
    }
  }
  return false;
}

