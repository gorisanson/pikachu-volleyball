/**
 * This is the main script which executes the game.
 * General explanations for the all source code files of the game are following.
 *
 ********************************************************************************************************************
 * This web version of the Pikachu Volleyball is made by
 * reverse engineering the core part of the original Pikachu Volleyball game
 * which is developed by "1997 (C) SACHI SOFT / SAWAYAKAN Programmers" & "1997 (C) Satoshi Takenouchi".
 *
 * "physics.js", "cloud_and_wave.js", and some codes in "view.js" are the results of this reverse engineering.
 * Refer the comments in each file for the machine code addresses of the original functions.
 ********************************************************************************************************************
 *
 * This web version game is mainly composed of three parts which follows MVC pattern.
 *  1) "physics.js" (Model): The physics engine which takes charge of the dynamics of the ball and the players (Pikachus).
 *                           It is gained by reverse engineering the machine code of the original game.
 *  2) "view.js" (View): The rendering part of the game which depends on pixi.js (https://www.pixijs.com/, https://github.com/pixijs/pixi.js) library.
 *                       Some codes in this part is gained by reverse engineering the original machine code.
 *  3) "pikavolley.js" (Controller): Make the game work by controlling the Model and the View according to the user input.
 *
 * And expainations for other source files are below.
 *  - "cloud_and_wave.js": This is also a Model part which takes charge of the clouds and wave motion in the game. Of course, it is also rendered by "view.js".
 *                         It is also gained by reverse engineering the original machine code.
 *  - "keyboard.js": Support the Controller("pikavolley.js") to get a user input via keyboard.
 *  - "audio.js": The game audio or sounds. It depends on pixi-sound (https://github.com/pixijs/pixi-sound) library.
 *  - "rand.js": For the random function used in the Models ("physics.js", "cloud_and_wave.js").
 *  - "assets_path.js": For the assets (image files, sound files) locations.
 *  - "ui.js": For the user interface (menu bar, buttons etc.) of the html page.
 */
'use strict';
import { settings } from '@pixi/settings';
import { SCALE_MODES } from '@pixi/constants';
import { Renderer, BatchRenderer, autoDetectRenderer } from '@pixi/core';
import { Prepare } from '@pixi/prepare';
import { Container } from '@pixi/display';
import { Loader } from '@pixi/loaders';
import { SpritesheetLoader } from '@pixi/spritesheet';
import { Ticker } from '@pixi/ticker';
import { CanvasRenderer } from '@pixi/canvas-renderer';
import { CanvasSpriteRenderer } from '@pixi/canvas-sprite';
import { CanvasPrepare } from '@pixi/canvas-prepare';
import '@pixi/canvas-display';
import { PikachuVolleyball } from './pikavolley.js';
import { ASSETS_PATH } from './assets_path.js';
import { setUpUI } from './ui.js';

// Reference for how to use Renderer.registerPlugin:
// https://github.com/pixijs/pixijs/blob/af3c0c6bb15aeb1049178c972e4a14bb4cabfce4/bundles/pixi.js/src/index.ts#L27-L34
Renderer.registerPlugin('prepare', Prepare);
Renderer.registerPlugin('batch', BatchRenderer);
// Reference for how to use CanvasRenderer.registerPlugin:
// https://github.com/pixijs/pixijs/blob/af3c0c6bb15aeb1049178c972e4a14bb4cabfce4/bundles/pixi.js-legacy/src/index.ts#L13-L19
CanvasRenderer.registerPlugin('prepare', CanvasPrepare);
CanvasRenderer.registerPlugin('sprite', CanvasSpriteRenderer);
Loader.registerPlugin(SpritesheetLoader);

// When the page is zoomed in or out in a browser, the value of window.devicePixelRatio
// can be a decimal number with nonzero factional part. For example, when I tested on my machine,
// the value of window.devicePixelRatio was 1.7999999523162842 in Chrome browser with 90% zoom.
// And If settings.RESOLUTION is set to be some decimal number with nonezero fractional part,
// some vertial/horizontal black lines, which are actullay the gaps between the sprite tiles
// covering the background, could apper on the canvas when CanvasRenderer is being used.
//
// The reason behind this buggy behavior seems to be the Math.foor being used
// in the context.drawImage in the source of pixi.js below:
// https://github.com/pixijs/pixijs/blob/a87bb87036d5fb9119ee92fd9c3da23b5bb9424b/packages/canvas-sprite/src/CanvasSpriteRenderer.ts#L158-L167
//
// Reference for CanvasRenderingContext2D.drawImage():
// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
//
// Math.ceil here is used to set settings.RESOLUTION always to an integer value whether or not
// the browser is zomming in or out, so to avoid the buggy behavior described above.
settings.RESOLUTION = Math.ceil(window.devicePixelRatio);
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

const renderer = autoDetectRenderer({
  width: 432,
  height: 304,
  antialias: false,
  backgroundColor: 0x000000,
  backgroundAlpha: 1,
  // Decided to use only Canvas for compatibility reason. One player had reported that
  // on theire browser, where pixi chooses to use WebGL renderer, the graphics are not fine.
  // And the issue had been fixed by using Canvas renderer. And also for the sake of testing,
  // it is more comfortable just to stick with Canvas renderer so that it is unnecessary to switch
  // between WebGL renderer and Canvas renderer.
  forceCanvas: true,
});

const stage = new Container();
const ticker = new Ticker();
const loader = new Loader();

renderer.view.setAttribute('id', 'game-canvas');
document.getElementById('game-canvas-container').appendChild(renderer.view);
renderer.render(stage); // To make the initial canvas painting stable in the Firefox browser.

loader.add(ASSETS_PATH.SPRITE_SHEET);
for (const prop in ASSETS_PATH.SOUNDS) {
  loader.add(ASSETS_PATH.SOUNDS[prop]);
}

setUpInitialUI();

/**
 * Set up the initial UI.
 */
function setUpInitialUI() {
  const loadingBox = document.getElementById('loading-box');
  const progressBar = document.getElementById('progress-bar');
  loader.onProgress.add(() => {
    progressBar.style.width = `${loader.progress}%`;
  });
  loader.onComplete.add(() => {
    if (!loadingBox.classList.contains('hidden')) {
      loadingBox.classList.add('hidden');
    }
  });

  const aboutBox = document.getElementById('about-box');
  const aboutBtn = document.getElementById('about-btn');
  const closeAboutBtn = document.getElementById('close-about-btn');
  const gameDropdownBtn = document.getElementById('game-dropdown-btn');
  const optionsDropdownBtn = document.getElementById('options-dropdown-btn');
  // @ts-ignore
  gameDropdownBtn.disabled = true;
  // @ts-ignore
  optionsDropdownBtn.disabled = true;
  const closeAboutBox = () => {
    if (!aboutBox.classList.contains('hidden')) {
      aboutBox.classList.add('hidden');
      // @ts-ignore
      aboutBtn.disabled = true;
    }
    aboutBtn.getElementsByClassName('text-play')[0].classList.add('hidden');
    aboutBtn.getElementsByClassName('text-about')[0].classList.remove('hidden');
    aboutBtn.classList.remove('glow');
    closeAboutBtn
      .getElementsByClassName('text-play')[0]
      .classList.add('hidden');
    closeAboutBtn
      .getElementsByClassName('text-close')[0]
      .classList.remove('hidden');
    closeAboutBtn.classList.remove('glow');

    loader.load(setup); // setup is called after loader finishes loading
    loadingBox.classList.remove('hidden');
    aboutBtn.removeEventListener('click', closeAboutBox);
    closeAboutBtn.removeEventListener('click', closeAboutBox);
  };
  aboutBtn.addEventListener('click', closeAboutBox);
  closeAboutBtn.addEventListener('click', closeAboutBox);
}

/**
 * Set up the game and the full UI, and start the game.
 */
function setup() {
  const pikaVolley = new PikachuVolleyball(stage, loader.resources);
  setUpUI(pikaVolley, ticker);
  start(pikaVolley);
}

/**
 * Start the game.
 * @param {PikachuVolleyball} pikaVolley
 */
function start(pikaVolley) {
  ticker.maxFPS = pikaVolley.normalFPS;
  ticker.add(() => {
    pikaVolley.gameLoop();
    renderer.render(stage);
  });
  ticker.start();
}
