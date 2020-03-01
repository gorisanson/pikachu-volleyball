let state;
const gameSprite = {};
let keyboardArray = [null, null];

//Aliases
let Application = PIXI.Application,
  loader = PIXI.Loader.shared,
  resources = loader.resources,
  Sprite = PIXI.Sprite,
  Rectangle = PIXI.Rectangle;

//Create a Pixi Application
let app = new Application({
  width: 432,
  height: 304,
  antialias: false,
  backgroundColor: 0x00ff00,
  transparent: false,
  resolution: 1.5
});

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

loader.add(["images/BITMAP103_1.png", "images/BITMAP104_1.png"]).load(setup);

function setup() {
  const ballTexture = resources["images/BITMAP104_1.png"].texture;
  const ballRectangle = new Rectangle(0, 0, 40, 40);
  ballTexture.frame = ballRectangle;

  const playerTexture = resources["images/BITMAP103_1.png"].texture;
  const playerRectangle = new Rectangle(0, 0, 64, 64);
  playerTexture.frame = playerRectangle;

  const ball = new Sprite(ballTexture);
  const player1 = new Sprite(playerTexture);
  const player2 = new Sprite(playerTexture);
  player2.scale.x = -1;

  ball.anchor.x = 0.5;
  ball.anchor.y = 0.5;
  player1.anchor.x = 0.5;
  player1.anchor.y = 0.5;
  player2.anchor.x = 0.5;
  player2.anchor.y = 0.5;

  app.stage.addChild(player1);
  app.stage.addChild(player2);
  app.stage.addChild(ball);

  player1.x = 60;
  player1.y = 180;

  ball.x = 216;
  ball.y = 100;

  player2.x = 300;
  player2.y = 180;

  //Render the stage
  //app.render();
  //app.renderer.render(app.stage);
  //const keyboard1 = new Keyboard("d", "g", "r", "f", "z");
  const keyboard2 = new Keyboard(
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Enter"
  );

  keyboardArray[0] = keyboard;
  keyboardArray[1] = Object.assign({}, keyboard);
  //keyboardArray[0] = keyboard1;
  //keyboardArray[1] = keyboard2;

  state = play;
  gameSprite.player1 = player1;
  gameSprite.player2 = player2;
  gameSprite.ball = ball;
  app.ticker.maxFPS = 25;
  app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
  state(delta);
}

let ballTouchedGround = false;
function play(delta) {
  if (ballTouchedGround) {
    player1 = {
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
    player2 = {
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
    ball = {
      x: 56, // 0x30    // initialized to 56 or 376
      y: 0, // 0x34   // initialized to 0
      xVelocity: 0, // 0x38  // initialized to 0
      yVelocity: 1, // 0x3C  // initialized to 1
      expectedLandingPointX: 0, // 0x40
      rotation: 0, // 0x44 // ball rotation frame selector // one of 0, 1, 2, 3, 4 // if it is other value, hyper ball glitch occur?
      fineRotation: 0,
      x4c: 0, // 0x4c // initialized to 0
      punchEffectX: 0, // coordinate X for punch effect
      punchEffectY: 0, // coordinate Y for punch effect
      isPowerHit: false // 0x68  // initialized to 0 i.e. false
    };
  }
  //keyboardArray[0].updateProperties();
  //keyboardArray[1].updateProperties();
  ballTouchedGround = physicsEngine(player1, player2, ball, keyboardArray);
  gameSprite.player1.x = player1.x;
  gameSprite.player1.y = player1.y;
  gameSprite.player2.x = player2.x;
  gameSprite.player2.y = player2.y;
  gameSprite.ball.x = ball.x;
  gameSprite.ball.y = ball.y;
}
