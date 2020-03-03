// Aliases
const Application = PIXI.Application;
const Sprite = PIXI.Sprite;
const Rectangle = PIXI.Rectangle;
const AnimatedSprite = PIXI.AnimatedSprite;
const Container = PIXI.Container;
const Graphics = PIXI.Graphics;

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
  nextState: null,
  FPS: 25,
  isPlayer2Serve: false,
  sprites: {
    player1: null,
    player2: null,
    ball: null,
    ballHyper: null,
    ballTrail: null,
    punch: null,
    black: null // for fade out effect
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
  },
  physics: {
    player1: new Player(false, true),
    player2: new Player(true, false),
    ball: new Ball(),
    sound: new Sound(),
    ballTouchedGround: false
  },
  keyboardArray: [
    new PikaKeyboard("d", "g", "r", "f", "z"), // for player1
    new PikaKeyboard("ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter") // for player2
  ]
};

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
  pikaVolley.app.stage.addChild(sprites.black);
  sprites.black.x = 0;
  sprites.black.y = 0;

  // TODO: state = startOfNewGame;
  // startOfNewGame function not made yet
  state = beforeStartOfNextRound;
  pikaVolley.app.view.addEventListener("click", gameStart, { once: true });
}

function gameStart() {
  pikaVolley.app.ticker.maxFPS = pikaVolley.FPS;
  pikaVolley.app.ticker.add(delta => gameLoop(delta));
  pikaVolley.audio.bgm.play();
}

function gameLoop(delta) {
  state(delta);
}

function afterEndOfRound(delta) {
  const black = pikaVolley.sprites.black;
  black.visible = true;
  black.alpha = Math.min(1, black.alpha + 0.2); // steadily increase alpha to 1 (fade out)
  if (black.alpha === 1) {
    state = beforeStartOfNextRound;
    return;
  }
}

const numOfFadeInFrames = 10;
let elapsedFadeInFrames = 0;
function beforeStartOfNextRound(delta) {
  const black = pikaVolley.sprites.black;
  if (elapsedFadeInFrames === 0) {
    drawGraphicForRoundStart();
  }
  if (elapsedFadeInFrames < numOfFadeInFrames) {
    elapsedFadeInFrames++;
    if (black.alpha > 0) {
      black.alpha = Math.max(0, black.alpha - 0.1);
    }
    return;
  }
  black.visible = false;
  black.alpha = 0;
  elapsedFadeInFrames = 0;
  roundEnded = false;
  state = round;
}

let roundEnded = false;
const numEndOfRoundFrames = 7;
let elapsedEndOfRoundFrames = 0;
const fpsEndOfRound = 5;
let skippedTick = 0;
function round(delta) {
  if (roundEnded === true) {
    if (elapsedEndOfRoundFrames < numEndOfRoundFrames) {
      skippedTick++;
      if (skippedTick % Math.round(pikaVolley.FPS / fpsEndOfRound) === 0) {
        elapsedEndOfRoundFrames++;
        // if this is the last frame of this round, begin fade out somewhat early
        if (elapsedEndOfRoundFrames === numEndOfRoundFrames) {
          const black = pikaVolley.sprites.black;
          black.visible = true;
          black.alpha += 0.2;
        }
      } else {
        return;
      }
    } else {
      elapsedEndOfRoundFrames = 0;
      elapsedFadeOutFrames = 0;
      skippedTick = 0;

      state = afterEndOfRound;
      return;
      // const black = pikaVolley.sprites.black;
      // black.visible = true;
      // if (elapsedFadeOutFrames < numOfFadeOutFrames) {
      //   elapsedFadeOutFrames++;
      //   if (black.alpha < 1) {
      //     black.alpha += 0.1;
      //   }
      //   return;
      // }
      // black.visible = false;
      // black.alpha = 0;

      // roundEnded = false;

      // player1.initialize();
      // player2.initialize();
      // ball.initialize();
    }
  }

  // catch keyboard input and freeze it
  pikaVolley.keyboardArray[0].updateProperties();
  pikaVolley.keyboardArray[1].updateProperties();

  const ballTouchedGround = physicsEngine(
    pikaVolley.physics.player1,
    pikaVolley.physics.player2,
    pikaVolley.physics.ball,
    pikaVolley.physics.sound,
    pikaVolley.keyboardArray
  );

  playSoundEffect();
  drawGraphicForPlayerAndBall();

  // TODO: move these to physics engine
  const ball = pikaVolley.physics.ball;
  ball.previousPreviousX = ball.previousX;
  ball.previousPreviousY = ball.previousY;
  ball.previousX = ball.x;
  ball.previousY = ball.y;

  if (ballTouchedGround) {
    roundEnded = true;
    // TODO: is it better for move this to physics function?
    // by including isPlayer2Serve property into ball
    if (ball.punchEffectX < 216) {
      pikaVolley.isPlayer2Serve = true;
    } else {
      pikaVolley.isPlayer2Serve = false;
    }
  }
}

function drawGraphicForRoundStart(delta) {
  pikaVolley.physics.player1.initialize();
  pikaVolley.physics.player2.initialize();
  pikaVolley.physics.ball.initialize(pikaVolley.isPlayer2Serve);
  drawGraphicForPlayerAndBall();
}

function playSoundEffect() {
  const sound = pikaVolley.physics.sound;
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
}

function drawGraphicForPlayerAndBall() {
  const player1 = pikaVolley.physics.player1;
  const player2 = pikaVolley.physics.player2;
  const ball = pikaVolley.physics.ball;

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

  // this is more efficient way than using 1x1px resources["black.png"]
  const blackRectangle = new Graphics();
  blackRectangle.beginFill(0x000000);
  blackRectangle.drawRect(0, 0, 432, 304);
  blackRectangle.endFill();
  blackRectangle.alpha = 0;
  blackRectangle.visible = false;

  pikaVolley.sprites.black = blackRectangle;
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
