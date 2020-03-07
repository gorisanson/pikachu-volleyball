"use strict";

import { Cloud, Wave, cloudAndWaveEngine } from "./pika_cloud_and_wave.js";

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

PATH.GAME_START = "messages/ko/game_start.png";
PATH.READY = "messages/common/ready.png";
PATH.GAME_END = "messages/common/game_end.png";

PATH.POKEMON = "messages/ko/pokemon.png";
PATH.PIKACHU_VOLLEYBALL = "messages/ko/pikachu_volleyball.png";
PATH.FIGHT = "messages/ko/fight.png";
PATH.WITH_COMPUTER = "messages/ko/with_computer.png";
PATH.WITH_FRIEND = "messages/ko/with_friend.png";

PATH.SACHISOFT = "messages/common/sachisoft.png";
PATH.MARK = "messages/ko/mark.png";
PATH.SITTING_PIKACHU = "pikachu_sitting.png";

export class MenuView {
  constructor(textures) {
    // this.sittingPikachu = ??
    this.messages = {
      pokemon: makeSpriteWithAnchorXY(textures, PATH.POKEMON, 0, 0),
      pikachuVolleyball: makeSpriteWithAnchorXY(
        textures,
        PATH.PIKACHU_VOLLEYBALL,
        0,
        0
      ),
      withComputer: makeSpriteWithAnchorXY(textures, PATH.WITH_COMPUTER, 0, 0),
      withFriend: makeSpriteWithAnchorXY(textures, PATH.WITH_FRIEND, 0, 0),
      sachisoft: makeSpriteWithAnchorXY(textures, PATH.SACHISOFT, 0, 0),
      fight: makeSpriteWithAnchorXY(textures, PATH.FIGHT, 0, 0)
    };

    this.container = new Container();
    this.container.x = 0;
    this.container.y = 0;
    this.container.addChild(this.messages.pokemon);
    this.container.addChild(this.messages.pikachuVolleyball);
    this.container.addChild(this.messages.withComputer);
    this.container.addChild(this.messages.withFriend);
    this.container.addChild(this.messages.fight);

    this.fightMessageSizeInfo = 0;
    this.fightMessageEnlarged = false;

    for (const prop in this.messages) {
      this.messages[prop].visible = false;
    }
  }

  get visible() {
    return this.container.visible;
  }

  set visible(bool) {
    this.container.visible = bool;
  }

  // refer FUN_00405d50
  moveFightMessage(frameCounter) {
    const sizeArray = [20, 22, 25, 27, 30, 27, 25, 22, 20];
    const fightMessage = this.messages.fight;
    const w = fightMessage.texture.width;
    const h = fightMessage.texture.height;

    if (frameCounter === 0) {
      fightMessage.visible = true;
      this.fightMessageSizeInfo = 0;
      this.fightMessageEnlarged = false;
    }

    if (this.fightMessageEnlarged === false) {
      this.fightMessageSizeInfo += 1;

      const halfWidth = Math.floor(
        Math.floor((this.fightMessageSizeInfo * w) / 30) / 2
      );
      const halfHeight = Math.floor(
        Math.floor((this.fightMessageSizeInfo * h) / 30) / 2
      );
      fightMessage.width = halfWidth * 2; // width
      fightMessage.height = halfHeight * 2; // height
      fightMessage.x = 100 - halfWidth; // x coor
      fightMessage.y = 70 - halfHeight; // y coord

      //// iVar3 = code ??
      // FUN_00409690
      if (this.fightMessageSizeInfo > 29) {
        this.fightMessageEnlarged = true;
        // FUN_00408ee0
        //param_1[0x1d] = 200;
        return;
      }
    } else {
      this.fightMessageSizeInfo = (this.fightMessageSizeInfo + 1) % 9;
      // code ...
      const halfWidth = Math.floor(
        Math.floor((sizeArray[this.fightMessageSizeInfo] * w) / 30) / 2
      );
      const halfHeight = Math.floor(
        Math.floor((sizeArray[this.fightMessageSizeInfo] * h) / 30) / 2
      );
      fightMessage.width = halfWidth * 2; // width
      fightMessage.height = halfHeight * 2; // heigth
      fightMessage.y = 70 - halfHeight; // y coord
      fightMessage.x = 100 - halfWidth; // x coord
      //iVar3 = code ??
      // FUN_00409690
    }
  }
}

export class GameView {
  constructor(textures) {
    // clouds and wave model.
    // This model is included in this view object, not on controller object
    // since it is not dependent on user input, and only used for rendering.
    this.cloudArray = [];
    for (let i = 0; i < NUM_OF_CLOUDS; i++) {
      this.cloudArray.push(new Cloud());
    }
    this.wave = new Wave();

    // Display objects below
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
      gameStart: makeSpriteWithAnchorXY(textures, PATH.GAME_START, 0, 0),
      ready: makeSpriteWithAnchorXY(textures, PATH.READY, 0, 0),
      gameEnd: makeSpriteWithAnchorXY(textures, PATH.GAME_END, 0, 0)
    };

    this.cloudContainer = makeCloudContainer(textures);
    this.waveContainer = makeWaveContainer(textures);

    // container which include whold display objects
    // Should be careful on addChild order
    // The later added, the more front(z-index) on screen
    this.container = new Container();
    this.container.x = 0;
    this.container.y = 0;
    this.container.addChild(this.bgContainer);
    this.container.addChild(this.cloudContainer);
    this.container.addChild(this.waveContainer);
    this.container.addChild(this.shadows.forPlayer1);
    this.container.addChild(this.shadows.forPlayer2);
    this.container.addChild(this.shadows.forBall);
    this.container.addChild(this.player1);
    this.container.addChild(this.player2);
    this.container.addChild(this.ballTrail);
    this.container.addChild(this.ballHyper);
    this.container.addChild(this.ball);
    this.container.addChild(this.punch);
    this.container.addChild(this.scoreBoards[0]);
    this.container.addChild(this.scoreBoards[1]);
    this.container.addChild(this.messages.gameStart);
    this.container.addChild(this.messages.ready);
    this.container.addChild(this.messages.gameEnd);

    // location and visibility setting
    this.bgContainer.x = 0;
    this.bgContainer.y = 0;
    this.cloudContainer.x = 0;
    this.cloudContainer.y = 0;
    this.waveContainer.x = 0;
    this.waveContainer.y = 0;

    this.messages.ready.x = 176;
    this.messages.ready.y = 38;
    this.scoreBoards[0].x = 14; // score board is 14 pixel distant from boundary
    this.scoreBoards[0].y = 10;
    this.scoreBoards[1].x = 432 - 32 - 32 - 14; // 32 pixel is for number (32x32px) width; one score board has tow numbers
    this.scoreBoards[1].y = 10;

    this.shadows.forPlayer1.y = 272;
    this.shadows.forPlayer2.y = 272;
    this.shadows.forBall.y = 272;

    this.ballHyper.visible = false;
    this.ballTrail.visible = false;
    this.punch.visible = false;

    for (const prop in this.messages) {
      this.messages[prop].visible = false;
    }
  }

  get visible() {
    return this.container.visible;
  }

  set visible(bool) {
    this.container.visible = bool;
  }

  // physics: PikaPhysics object
  drawPlayerAndBall(physics) {
    const player1 = physics.player1;
    const player2 = physics.player2;
    const ball = physics.ball;

    this.player1.x = player1.x;
    this.player1.y = player1.y;
    this.shadows.forPlayer1.x = player1.x;
    this.player2.x = player2.x;
    this.player2.y = player2.y;
    this.shadows.forPlayer2.x = player2.x;

    const frameNumber1 = getFrameNumberForPlayerAnimatedSprite(
      player1.state,
      player1.frameNumber
    );
    const frameNumber2 = getFrameNumberForPlayerAnimatedSprite(
      player2.state,
      player2.frameNumber
    );
    this.player1.gotoAndStop(frameNumber1);
    this.player2.gotoAndStop(frameNumber2);

    this.ball.x = ball.x;
    this.ball.y = ball.y;
    this.shadows.forBall.x = ball.x;
    this.ball.gotoAndStop(ball.rotation);

    // For punch effect, refer FUN_00402ee0
    if (ball.punchEffectRadius > 0) {
      ball.punchEffectRadius -= 2;
      this.punch.width = 2 * ball.punchEffectRadius;
      this.punch.height = 2 * ball.punchEffectRadius;
      this.punch.x = ball.punchEffectX;
      this.punch.y = ball.punchEffectY;
      this.punch.visible = true;
    } else {
      this.punch.visible = false;
    }

    if (ball.isPowerHit === true) {
      this.ballHyper.x = ball.previousX;
      this.ballHyper.y = ball.previousY;
      this.ballTrail.x = ball.previousPreviousX;
      this.ballTrail.y = ball.previousPreviousY;

      this.ballHyper.visible = true;
      this.ballTrail.visible = true;
    } else {
      this.ballHyper.visible = false;
      this.ballTrail.visible = false;
    }
  }

  // this funtion corresponds to FUN_00404770 in origianl machine (assembly) code
  drawCloudsAndWave() {
    const cloudArray = this.cloudArray;
    const wave = this.wave;

    cloudAndWaveEngine(cloudArray, wave);

    for (let i = 0; i < NUM_OF_CLOUDS; i++) {
      const cloud = cloudArray[i];
      const cloudSprite = this.cloudContainer.getChildAt(i);
      cloudSprite.x = cloud.spriteTopLeftPointX;
      cloudSprite.y = cloud.spriteTopLeftPointY;
      cloudSprite.width = cloud.spriteWidth;
      cloudSprite.height = cloud.spriteHeight;
    }

    for (let i = 0; i < 432 / 16; i++) {
      const waveSprite = this.waveContainer.getChildAt(i);
      waveSprite.y = wave.yCoords[i];
    }
  }

  // refered FUN_00403f20
  drawGameStartMessageForFrameNo(frameCounter, frameTotal) {
    if (frameCounter === 0) {
      this.messages.gameStart.visible = true;
    } else if (frameCounter >= frameTotal - 1) {
      this.messages.gameStart.visible = false;
      return;
    }

    const gameStartMessage = this.messages.gameStart;
    // game start message rendering
    const w = gameStartMessage.texture.width; // game start message texture width
    const h = gameStartMessage.texture.height; // game start message texture height
    const halfWidth = Math.floor((w * frameCounter) / 50);
    const halfHeight = Math.floor((h * frameCounter) / 50);
    gameStartMessage.x = 216 - halfWidth;
    gameStartMessage.y = 50 + 2 * halfHeight;
    gameStartMessage.width = 2 * halfWidth;
    gameStartMessage.height = 2 * halfHeight;
  }

  showReadyMessage(bool) {
    this.messages.ready.visible = bool;
  }

  toggleReadyMessage() {
    this.messages.ready.visible = !this.messages.ready.visible;
  }

  // refered FUN_00404070
  drawGameEndMessageForFrameNo(frameCounter, frameTotal) {
    const gameEndMessage = this.messages.gameEnd;
    const w = gameEndMessage.texture.width; // game end message texture width;
    const h = gameEndMessage.texture.height; // game end message texture height;

    if (frameCounter === 0) {
      gameEndMessage.visible = true;
    }
    if (frameCounter < 50) {
      const halfWidthIncrement = 2 * Math.floor(((50 - frameCounter) * w) / 50);
      const halfHeightIncrement =
        2 * Math.floor(((50 - frameCounter) * h) / 50);

      gameEndMessage.x = 216 - w / 2 - halfWidthIncrement;
      gameEndMessage.y = 50 - halfHeightIncrement;
      gameEndMessage.width = w + 2 * halfWidthIncrement;
      gameEndMessage.height = h + 2 * halfHeightIncrement;
    } else {
      gameEndMessage.x = 216 - w / 2;
      gameEndMessage.y = 50;
      gameEndMessage.width = w;
      gameEndMessage.height = h;
    }
    if (frameCounter >= frameTotal - 1) {
      gameEndMessage.visible = false;
    }
  }

  // scores: array with length 2
  // scores[0] for player1 score, scores[1] for player2 score
  showScoreToScoreBoard(scores) {
    for (let i = 0; i < 2; i++) {
      const scoreBoard = this.scoreBoards[i];
      const score = scores[i];
      const unitsAnimatedSprite = scoreBoard.getChildAt(0);
      const tensAnimatedSprite = scoreBoard.getChildAt(1);
      unitsAnimatedSprite.gotoAndStop(score % 10);
      tensAnimatedSprite.gotoAndStop(Math.floor(score / 10) % 10);
      if (score >= 10) {
        tensAnimatedSprite.visible = true;
      } else {
        tensAnimatedSprite.visible = false;
      }
    }
  }
}

export class FadeInOut {
  constructor() {
    this.black = new Graphics();
    this.black.beginFill(0x000000);
    this.black.drawRect(0, 0, 432, 304);
    this.black.endFill();
    this.black.x = 0;
    this.black.y = 0;
    this.black.alpha = 1;
  }

  get visible() {
    return this.black.visible;
  }

  set visible(bool) {
    this.black.visible = bool;
  }

  setBlackAlphaTo(alpha) {
    this.black.alpha = alpha;
    if (this.black.alpha === 0) {
      this.black.visible = false;
    } else {
      this.black.visible = true;
    }
  }

  // if alphaIncrement > 0: fade out, else fade in
  changeBlackAlphaBy(alphaIncrement) {
    if (alphaIncrement >= 0) {
      this.black.alpha = Math.min(1, this.black.alpha + alphaIncrement);
    } else {
      this.black.alpha = Math.max(0, this.black.alpha + alphaIncrement);
    }
    if (this.black.alpha === 0) {
      this.black.visible = false;
    } else {
      this.black.visible = true;
    }
  }
}

// make background
// return: Container object that has objects in the backgournd as children
function makeBGContainer(textures) {
  const bgContainer = new Container();

  // green background
  const green = new Graphics();
  green.beginFill(0x00ff00);
  green.drawRect(0, 0, 432, 304);
  green.endFill();
  green.x = 0;
  green.y = 0;
  bgContainer.addChild(green);

  // sky
  let tile;
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
    return 18 + 5 * (state - 5) + frameNumber;
  }
}
