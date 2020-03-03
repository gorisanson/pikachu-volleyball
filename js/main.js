// Aliases
const Application = PIXI.Application;
const Sprite = PIXI.Sprite;
const Rectangle = PIXI.Rectangle;
const AnimatedSprite = PIXI.AnimatedSprite;
const Container = PIXI.Container;

// global variables are in "pikaVolley"
const pikaVolley = {
  loader: PIXI.Loader.shared,
  app: new Application({
    width: 432,
    height: 304,
    antialias: false,
    backgroundColor: 0x00ff00,
    transparent: false,
    resolution: 1.5
  }),
  state: null,
  sprites: {
    player1: null,
    player2: null,
    ball: null,
    ballHyper: null,
    ballTrail: null,
    punch: null
  },
  audio: {
    bgm: new Audio("assets/bgm.mp3"),
    pipikachu: new Audio("assets/WAVE140_1.wav"),
    pika: new Audio("assets/WAVE141_1.wav"),
    chu: new Audio("assets/WAVE142_1.wav"),
    pi: new Audio("assets/WAVE143_1.wav"),
    pikachu: new Audio("assets/WAVE144_1.wav"),
    powerHit: new Audio("assets/WAVE145_1.wav"),
    ballTouchesGround: new Audio("assets/WAVE146_1.wav")
  }
};
let keyboardArray = [null, null];

document.body.appendChild(pikaVolley.app.view);
pikaVolley.loader.add("assets/sprite_sheet.json").load(setup);

function setup() {
  // adjust audio setting
  const audio = pikaVolley.audio;
  audio.bgm.loop = true;
  for (p in audio) {
    audio[p].volume = 0.3;
  }

  // background
  const bgContainer = setAndReturnBGContainer();
  pikaVolley.app.stage.addChild(bgContainer);
  bgContainer.x = 0;
  bgContainer.y = 0;

  // TODO: careful with the order of addChild, the later, the fronter?

  setSprites();
  const sprites = pikaVolley.sprites;
  pikaVolley.app.stage.addChild(sprites.player1);
  pikaVolley.app.stage.addChild(sprites.player2);
  pikaVolley.app.stage.addChild(sprites.ball);
  pikaVolley.app.stage.addChild(sprites.ballHyper);
  pikaVolley.app.stage.addChild(sprites.ballTrail);
  pikaVolley.app.stage.addChild(sprites.punch);

  //Render the stage
  //app.render();
  //app.renderer.render(app.stage);
  const keyboard1 = new Keyboard("d", "g", "r", "f", "z");
  const keyboard2 = new Keyboard(
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Enter"
  );

  //keyboardArray[0] = keyboard;
  //keyboardArray[1] = Object.assign({}, keyboard);
  keyboardArray[0] = keyboard1;
  keyboardArray[1] = keyboard2;

  state = play;

  pikaVolley.app.view.addEventListener("click", gameStart, { once: true });
}

function gameStart() {
  pikaVolley.app.ticker.maxFPS = 25;
  pikaVolley.app.ticker.add(delta => gameLoop(delta));
  pikaVolley.audio.bgm.play();
}

function gameLoop(delta) {
  state(delta);
}

let ballTouchedGround = false;
function play(delta) {
  if (ballTouchedGround) {
    player1 = {
      isPlayer2: false, // 0xA0
      isComputer: player1.isComputer, // 0xA4
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
      isComputer: player2.isComputer, // 0xA4
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
      rotation: 0, // 0x44 // ball rotation frame selector // one of 0, 1, 2, 3, 4 // if it is other value, ballHyper ball glitch occur?
      fineRotation: 0,
      x4c: 0, // 0x4c // initialized to 0
      punchEffectX: 0, // coordinate X for punch effect
      punchEffectY: 0, // coordinate Y for punch effect
      isPowerHit: false // 0x68  // initialized to 0 i.e. false
    };
  }

  const audio = pikaVolley.audio;
  if (sound.pipikachu === true) {
    audio.pipikachu.play();
    sound.pipikachu = false;
  }
  if (sound.pika === true) {
    audio.pika.play();
    sound.pika = false;
  }
  if (sound.chu === true) {
    audio.chu.play();
    sound.chu = false;
  }
  if (sound.powerHit === true) {
    audio.powerHit.play();
    sound.powerHit = false;
  }
  if (sound.ballTouchesGround === true) {
    audio.ballTouchesGround.play();
    sound.ballTouchesGround = false;
  }

  const sprites = pikaVolley.sprites;

  sprites.player1.x = player1.x;
  sprites.player1.y = player1.y;
  sprites.player2.x = player2.x;
  sprites.player2.y = player2.y;

  const frameNumber1 = getFrameNumberForPlayerAnimatedSprite(
    player1.state,
    player1.frameNumber
  );
  const frameNumber2 = getFrameNumberForPlayerAnimatedSprite(
    player2.state,
    player2.frameNumber
  );
  sprites.player1.gotoAndStop(frameNumber1);
  sprites.player2.gotoAndStop(frameNumber2);

  sprites.ball.x = ball.x;
  sprites.ball.y = ball.y;
  sprites.ball.gotoAndStop(ball.rotation);

  if (ball.punchEffectRadius > 0) {
    ball.punchEffectRadius -= 2;
    sprites.punch.width = 2 * ball.punchEffectRadius;
    sprites.punch.height = 2 * ball.punchEffectRadius;
    sprites.punch.x = ball.punchEffectX;
    sprites.punch.y = ball.punchEffectY;
    sprites.punch.visible = true;
  } else {
    sprites.punch.visible = false;
  }

  if (ball.isPowerHit === true) {
    sprites.ballHyper.x = ball.previousX;
    sprites.ballHyper.y = ball.previousY;
    sprites.ballTrail.x = ball.previousPreviousX;
    sprites.ballTrail.y = ball.previousPreviousY;

    sprites.ballHyper.visible = true;
    sprites.ballTrail.visible = true;
  } else {
    sprites.ballHyper.visible = false;
    sprites.ballTrail.visible = false;
  }
  ball.previousPreviousX = ball.previousX;
  ball.previousPreviousY = ball.previousY;
  ball.previousX = ball.x;
  ball.previousY = ball.y;

  keyboardArray[0].updateProperties();
  keyboardArray[1].updateProperties();
  ballTouchedGround = physicsEngine(
    player1,
    player2,
    ball,
    sound,
    keyboardArray
  );
}

// set background
// return: Container object that has objects in the backgournd as children
function setAndReturnBGContainer() {
  const textures =
    pikaVolley.loader.resources["assets/sprite_sheet.json"].textures;
  const bgContainer = new Container();
  let tile;

  // sky
  let texture = textures["objects/sky_blue.png"];
  for (let j = 0; j < 11; j++) {
    for (let i = 0; i < 432 / 16; i++) {
      tile = new Sprite(texture);
      addChildToParentAndSetLocalPosition(bgContainer, tile, 16 * i, 16 * j);
    }
  }

  // mountain
  texture = textures["objects/mountain.png"];
  tile = new Sprite(texture);
  addChildToParentAndSetLocalPosition(bgContainer, tile, 0, 176);

  // ground_red
  texture = textures["objects/ground_red.png"];
  for (let i = 0; i < 432 / 16; i++) {
    tile = new Sprite(texture);
    addChildToParentAndSetLocalPosition(bgContainer, tile, 16 * i, 248);
  }

  // ground_line
  texture = textures["objects/ground_line.png"];
  for (let i = 1; i < 432 / 16 - 1; i++) {
    tile = new Sprite(texture);
    addChildToParentAndSetLocalPosition(bgContainer, tile, 16 * i, 264);
  }
  texture = textures["objects/ground_line_leftmost.png"];
  tile = new Sprite(texture);
  addChildToParentAndSetLocalPosition(bgContainer, tile, 0, 264);
  texture = textures["objects/ground_line_rightmost.png"];
  tile = new Sprite(texture);
  addChildToParentAndSetLocalPosition(bgContainer, tile, 432 - 16, 264);

  // ground_yellow
  texture = textures["objects/ground_yellow.png"];
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 432 / 16; i++) {
      tile = new Sprite(texture);
      addChildToParentAndSetLocalPosition(
        bgContainer,
        tile,
        16 * i,
        280 + 16 * j
      );
    }
  }

  // TODO: wave moving
  // wave
  texture = textures["objects/wave.png"];
  for (let i = 0; i < 432 / 16; i++) {
    tile = new Sprite(texture);
    addChildToParentAndSetLocalPosition(bgContainer, tile, 16 * i, 280);
  }

  // net pillar
  texture = textures["objects/net_pillar_top.png"];
  tile = new Sprite(texture);
  addChildToParentAndSetLocalPosition(bgContainer, tile, 213, 176);
  texture = textures["objects/net_pillar.png"];
  for (let j = 0; j < 12; j++) {
    tile = new Sprite(texture);
    addChildToParentAndSetLocalPosition(bgContainer, tile, 213, 184 + 8 * j);
  }

  return bgContainer;
}

function setSprites() {
  const textures =
    pikaVolley.loader.resources["assets/sprite_sheet.json"].textures;

  const getPlayerTexture = (i, j) => textures[`pikachu/pikachu_${i}_${j}.png`];
  const playerTextureArray = [];
  for (let i = 0; i < 7; i++) {
    if (i === 3) {
      playerTextureArray.push(getPlayerTexture(i, 0));
      playerTextureArray.push(getPlayerTexture(i, 1));
    } else if (i === 4) {
      playerTextureArray.push(getPlayerTexture(i, 0));
    } else {
      for (let j = 0; j < 5; j++) {
        playerTextureArray.push(getPlayerTexture(i, j));
      }
    }
  }
  const player1AnimatedSprite = new AnimatedSprite(playerTextureArray);
  const player2AnimatedSprite = new AnimatedSprite(playerTextureArray);
  player2AnimatedSprite.scale.x = -1;

  const getBallTexture = s => textures[`ball/ball_${s}.png`];
  const ballTextureArray = [
    getBallTexture(0),
    getBallTexture(1),
    getBallTexture(2),
    getBallTexture(3),
    getBallTexture(4),
    getBallTexture("hyper")
  ];
  const ballAnimatedSprite = new AnimatedSprite(ballTextureArray);

  const ballHyperSprite = new Sprite(textures["ball/ball_hyper.png"]);
  const ballTrailSprite = new Sprite(textures["ball/ball_trail.png"]);
  const ballPunchSprite = new Sprite(textures["ball/ball_punch.png"]);

  player1AnimatedSprite.anchor.x = 0.5;
  player1AnimatedSprite.anchor.y = 0.5;
  player2AnimatedSprite.anchor.x = 0.5;
  player2AnimatedSprite.anchor.y = 0.5;
  ballAnimatedSprite.anchor.x = 0.5;
  ballAnimatedSprite.anchor.y = 0.5;
  ballHyperSprite.anchor.x = 0.5;
  ballHyperSprite.anchor.y = 0.5;
  ballTrailSprite.anchor.x = 0.5;
  ballTrailSprite.anchor.y = 0.5;
  ballPunchSprite.anchor.x = 0.5;
  ballPunchSprite.anchor.y = 0.5;

  ballTrailSprite.visible = false;
  ballHyperSprite.visible = false;
  ballPunchSprite.visible = false;

  pikaVolley.sprites.player1 = player1AnimatedSprite;
  pikaVolley.sprites.player2 = player2AnimatedSprite;
  pikaVolley.sprites.ball = ballAnimatedSprite;
  pikaVolley.sprites.ballHyper = ballHyperSprite;
  pikaVolley.sprites.ballTrail = ballTrailSprite;
  pikaVolley.sprites.punch = ballPunchSprite;
}

function addChildToParentAndSetLocalPosition(parent, child, x, y) {
  parent.addChild(child);
  child.anchor.x = 0;
  child.anchor.y = 0;
  child.x = x;
  child.y = y;
}

// number of frames for state 0, state 1 and state 2 is 5 for each.
// number of frames for state 3 is 2.
// number of frames for state 4 is 1.
// number of frames for state 5, state 6 is 5 for each.
function getFrameNumberForPlayerAnimatedSprite(state, frameNumber) {
  if (state < 4) {
    return 5 * state + frameNumber;
  } else if (state === 4) {
    return 17 + frameNumber;
  } else if (state > 4) {
    return 18 + frameNumber;
  }
}
