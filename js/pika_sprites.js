"use strict";
const Container = PIXI.Container;
const Sprite = PIXI.Sprite;
const AnimatedSprite = PIXI.AnimatedSprite;
const Graphics = PIXI.Graphics;

// TODO: this should be removed.. later..
const NUM_OF_CLOUDS = 10;

const PATH = {};

PATH.PIKACHU = (i, j) => `pikachu/pikachu_${i}_${j}.png`;
PATH.BALL = s => `ball/ball_${s}.png`;
PATH.NUMBER = n => `number/number_${n}.png`;

PATH.SKY_BLUE = "objects/sky_blue.png";
PATH.MOUNTAIN = "objects/mountain.png";
PATH.GROUND_RED = "objects/ground_red.png";
PATH.GROUND_LINE = "objects/ground_line.png";
PATH.GROUND_LINE_LEFT_MOST = "objects/ground_line_leftmost.png";
PATH.GROUND_LINE_RIGHT_MOST = "objects/ground_line_rightmost.png";
PATH.GROUND_YELLOW = "objects/ground_yellow.png";
PATH.NET_PILLAR_TOP = "objects/net_pillar_top.png";
PATH.NET_PILLAR = "objects/net_pillar.png";
PATH.SHADOW = "objects/shadow.png";
PATH.BALL_HYPER = "ball/ball_hyper.png";
PATH.BALL_TRAIL = "ball/ball_trail.png";
PATH.BALL_PUNCH = "ball/ball_punch.png";
PATH.CLOUD = "objects/cloud.png";
PATH.WAVE = "objects/wave.png";

PATH.FIGHT = "messages/ko/fight.png";
PATH.GAME_START = "messages/ko/game_start.png";
PATH.READY = "messages/common/ready.png";
PATH.GAME_END = "messages/common/game_end.png";

export class PikaSprites {
  // textures: PIXI.Spritesheet.textures (e.g. loader.resources["assets/sprite_sheet.json"].textures)
  constructor(textures) {
    this.bgContainer = makeBGContainer(textures);
    [this.player1, this.player2] = makePlayerAnimatedSprites(textures);
    this.ball = makeBallAnimatedSprites(textures);
    this.ballHyper = makeSpriteWithAnchorXY(
      textures,
      PATH.BALL_HYPER,
      0.5,
      0.5
    );
    this.ballTrail = makeSpriteWithAnchorXY(
      textures,
      PATH.BALL_TRAIL,
      0.5,
      0.5
    );
    this.punch = makeSpriteWithAnchorXY(textures, PATH.BALL_PUNCH, 0.5, 0.5);

    // this.scoreBoards[0] for player1, this.scoreBoards[1] for player2
    this.scoreBoards = [
      makeScoreBoardSprite(textures),
      makeScoreBoardSprite(textures)
    ];

    this.shadows = {
      forPlayer1: makeSpriteWithAnchorXY(textures, PATH.SHADOW, 0.5, 0.5),
      forPlayer2: makeSpriteWithAnchorXY(textures, PATH.SHADOW, 0.5, 0.5),
      forBall: makeSpriteWithAnchorXY(textures, PATH.SHADOW, 0.5, 0.5)
    };

    this.messages = {
      fight: makeSpriteWithAnchorXY(textures, PATH.FIGHT, 0, 0),
      gameStart: makeSpriteWithAnchorXY(textures, PATH.GAME_START, 0, 0),
      ready: makeSpriteWithAnchorXY(textures, PATH.READY, 0, 0),
      gameEnd: makeSpriteWithAnchorXY(textures, PATH.GAME_END, 0, 0)
    };

    this.cloudContainer = makeCloudContainer(textures);
    this.waveContainer = makeWaveContainer(textures);

    this.black = makeBlackSprite();
  }
}

// set background
// return: Container object that has objects in the backgournd as children
function makeBGContainer(textures) {
  const bgContainer = new Container();
  let tile;

  // sky
  let texture = textures[PATH.SKY_BLUE];
  for (let j = 0; j < 12; j++) {
    for (let i = 0; i < 432 / 16; i++) {
      tile = new Sprite(texture);
      addChildToParentAndSetLocalPosition(bgContainer, tile, 16 * i, 16 * j);
    }
  }

  // mountain
  texture = textures[PATH.MOUNTAIN];
  tile = new Sprite(texture);
  addChildToParentAndSetLocalPosition(bgContainer, tile, 0, 188);

  // ground_red
  texture = textures[PATH.GROUND_RED];
  for (let i = 0; i < 432 / 16; i++) {
    tile = new Sprite(texture);
    addChildToParentAndSetLocalPosition(bgContainer, tile, 16 * i, 248);
  }

  // ground_line
  texture = textures[PATH.GROUND_LINE];
  for (let i = 1; i < 432 / 16 - 1; i++) {
    tile = new Sprite(texture);
    addChildToParentAndSetLocalPosition(bgContainer, tile, 16 * i, 264);
  }
  texture = textures[PATH.GROUND_LINE_LEFT_MOST];
  tile = new Sprite(texture);
  addChildToParentAndSetLocalPosition(bgContainer, tile, 0, 264);
  texture = textures[PATH.GROUND_LINE_RIGHT_MOST];
  tile = new Sprite(texture);
  addChildToParentAndSetLocalPosition(bgContainer, tile, 432 - 16, 264);

  // ground_yellow
  texture = textures[PATH.GROUND_YELLOW];
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

  // net pillar
  texture = textures[PATH.NET_PILLAR_TOP];
  tile = new Sprite(texture);
  addChildToParentAndSetLocalPosition(bgContainer, tile, 213, 176);
  texture = textures[PATH.NET_PILLAR];
  for (let j = 0; j < 12; j++) {
    tile = new Sprite(texture);
    addChildToParentAndSetLocalPosition(bgContainer, tile, 213, 184 + 8 * j);
  }

  return bgContainer;
}

function makePlayerAnimatedSprites(textures) {
  const getPlayerTexture = (i, j) => textures[PATH.PIKACHU(i, j)];
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
  const player1AnimatedSprite = new AnimatedSprite(playerTextureArray, false);
  const player2AnimatedSprite = new AnimatedSprite(playerTextureArray, false);
  player2AnimatedSprite.scale.x = -1;

  player1AnimatedSprite.anchor.x = 0.5;
  player1AnimatedSprite.anchor.y = 0.5;
  player2AnimatedSprite.anchor.x = 0.5;
  player2AnimatedSprite.anchor.y = 0.5;

  return [player1AnimatedSprite, player2AnimatedSprite];
}

function makeBallAnimatedSprites(textures) {
  const getBallTexture = s => textures[PATH.BALL(s)];
  const ballTextureArray = [
    getBallTexture(0),
    getBallTexture(1),
    getBallTexture(2),
    getBallTexture(3),
    getBallTexture(4),
    getBallTexture("hyper")
  ];
  const ballAnimatedSprite = new AnimatedSprite(ballTextureArray, false);

  ballAnimatedSprite.anchor.x = 0.5;
  ballAnimatedSprite.anchor.y = 0.5;

  return ballAnimatedSprite;
}

function makeSpriteWithAnchorXY(textures, path, anchorX, anchorY) {
  const sprite = new Sprite(textures[path]);
  sprite.anchor.x = anchorX;
  sprite.anchor.y = anchorY;
  return sprite;
}

function makeBlackSprite() {
  // this is more efficient way than using 1x1px resources["black.png"]
  const blackRectangle = new Graphics();
  blackRectangle.beginFill(0x000000);
  blackRectangle.drawRect(0, 0, 432, 304);
  blackRectangle.endFill();

  return blackRectangle;
}

function makeScoreBoardSprite(textures) {
  const getNumberTexture = n => textures[PATH.NUMBER(n)];
  const numberTextureArray = [];
  for (let i = 0; i < 10; i++) {
    numberTextureArray.push(getNumberTexture(i));
  }
  const numberAnimatedSprites = [null, null];
  numberAnimatedSprites[0] = new AnimatedSprite(numberTextureArray, false);
  numberAnimatedSprites[1] = new AnimatedSprite(numberTextureArray, false);

  const scoreBoard = new Container();
  addChildToParentAndSetLocalPosition(
    scoreBoard,
    numberAnimatedSprites[0],
    32,
    0
  ); // for units
  addChildToParentAndSetLocalPosition(
    scoreBoard,
    numberAnimatedSprites[1],
    0,
    0
  ); // for tens

  scoreBoard.setChildIndex(numberAnimatedSprites[0], 0); // for units
  scoreBoard.setChildIndex(numberAnimatedSprites[1], 1); // for tens

  return scoreBoard;
}

function makeCloudContainer(textures) {
  const cloudContainer = new Container();
  const texture = textures[PATH.CLOUD];
  for (let i = 0; i < NUM_OF_CLOUDS; i++) {
    const cloud = new Sprite(texture);
    cloud.anchor.x = 0;
    cloud.anchor.y = 0;
    cloudContainer.addChild(cloud);
  }

  return cloudContainer;
}

function makeWaveContainer(textures) {
  const waveContainer = new Container();
  const texture = textures[PATH.WAVE];
  for (let i = 0; i < 432 / 16; i++) {
    const tile = new Sprite(texture);
    addChildToParentAndSetLocalPosition(waveContainer, tile, 16 * i, 0);
  }

  return waveContainer;
}

function addChildToParentAndSetLocalPosition(parent, child, x, y) {
  parent.addChild(child);
  child.anchor.x = 0;
  child.anchor.y = 0;
  child.x = x;
  child.y = y;
}
