/*
*  X width: 432 = 0x1B0
*  Y width: 304 = 0x130
* 
*  X position coord right-direction increasing
*  Y position coord down-direction increasing
* 
*  Ball radius: 20 = 0x14
*/



const ball = {
  x: 0, // 0x30
  y: 0, // 0x34
  velocity_x: 0, // 0x38
  velocity_y: 0, // 0x3C
  expected_landing_point_x: 40000, // 0x40
  is_power_hit: false // 0x68
};

function ball_trajectory(ball) {
  const future_ball_x = ball.x + ball.velocity_x;
  // If the center of ball would get out of left world bound or right world bound
  //
  // TODO:
  // future_ball_x < 20 shoud be changed to future_ball_x < 0
  // I think this is a mistake of the author of the original game.
  if (future_ball_x < 20 || future_ball_x > 432) {
    ball.velocity_x = -ball.velocity_x;
  }

  let future_ball_y = ball.y + ball.velocity_y;
  // if the center of ball would get out of upper world bound
  if (future_ball_y < 0) {
    ball.velocity_y = 1;
  }

  // If ball touch net
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
    ball.velocity_y = -ball.velocity_y;
    ball.y = 252;
    return 1;
  }
  ball.y = future_ball_y;
  ball.x = ball.x + ball.velocity_x;
  ball.velocity_y += 1;

  return 0;
}

function ball_pika_collision(
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
  
  return 1;
}
