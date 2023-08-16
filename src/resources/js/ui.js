/**
 * Manages event listeners relevant to the UI (menu bar, buttons, etc.) of the web page
 */
'use strict';

import { replaySaver } from './replay/replay_saver.js';

/** @typedef {import('./pikavolley.js').PikachuVolleyball} PikachuVolleyball */
/** @typedef {import('pixi.js-legacy').Ticker} Ticker */
export var serveMode = 0;
export var SkillTypeForPlayer1Available = [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
];
export var SkillTypeForPlayer2Available = [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
];
export var capability = {
  serve: true,
  fancy: true,
  block: true,
  diving: true,
  anti_block: true,
  early_ball: false,
  jump: false,
};
export var delay = 0; // 3 is good
export var defense = 4; // mid, mid_mirror, mirror, predict, close
/**
 * Enum for "game paused by what?".
 * The greater the number, the higher the precedence.
 *
 * @readonly
 * @enum {number}
 */
const PauseResumePrecedence = {
  pauseBtn: 3,
  messageBox: 2,
  dropdown: 1,
  notPaused: 0,
};

/**
 * Manages pausing and resuming of the game
 */
const pauseResumeManager = {
  /** @type {number} PauseResumePrecedence enum */
  _precedence: PauseResumePrecedence.notPaused,
  /**
   * Pause game
   * @param {PikachuVolleyball} pikaVolley
   * @param {number} precedence PauseResumePrecedence enum
   */
  pause: function (pikaVolley, precedence) {
    // @ts-ignore
    if (precedence > this._precedence) {
      pikaVolley.paused = true;
      this._precedence = precedence;
    }
  },
  /**
   * Resume game
   * @param {PikachuVolleyball} pikaVolley
   * @param {number} precedence PauseResumePrecedence enum
   */
  resume: function (pikaVolley, precedence) {
    if (precedence === this._precedence) {
      pikaVolley.paused = false;
      this._precedence = PauseResumePrecedence.notPaused;
    }
  },
};

/**
 * Set up the user interface: menu bar, buttons, dropdowns, submenus, etc.
 * @param {PikachuVolleyball} pikaVolley
 * @param {Ticker} ticker
 */
export function setUpUI(pikaVolley, ticker) {
  setUpBtns(pikaVolley, ticker);
  setUpToShowDropdownsAndSubmenus(pikaVolley);

  // hide or show menubar if the user presses the "esc" key
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      const menuBar = document.getElementById('menu-bar');
      if (menuBar.classList.contains('hidden')) {
        menuBar.classList.remove('hidden');
      } else {
        menuBar.classList.add('hidden');
      }
      event.preventDefault();
    } else if (event.code === 'Space') {
      const aboutBox = document.getElementById('about-box');
      if (aboutBox.classList.contains('hidden')) {
        event.preventDefault();
      }
    }
  });
}

/**
 * Attach event listeners to the buttons
 * @param {PikachuVolleyball} pikaVolley
 * @param {Ticker} ticker
 */
function setUpBtns(pikaVolley, ticker) {
  const gameDropdownBtn = document.getElementById('game-dropdown-btn');
  const optionsDropdownBtn = document.getElementById('options-dropdown-btn');
  const serveModeDropdownBtn = document.getElementById(
    'serve-mode-dropdown-btn'
  );
  const aboutBtn = document.getElementById('about-btn');
  // @ts-ignore
  gameDropdownBtn.disabled = false;
  // @ts-ignore
  optionsDropdownBtn.disabled = false;
  // @ts-ignore
  serveModeDropdownBtn.disabled = false;
  // @ts-ignore
  aboutBtn.disabled = false;

  const pauseBtn = document.getElementById('pause-btn');
  pauseBtn.addEventListener('click', () => {
    if (pauseBtn.classList.contains('selected')) {
      pauseBtn.classList.remove('selected');
      pauseResumeManager.resume(pikaVolley, PauseResumePrecedence.pauseBtn);
    } else {
      pauseBtn.classList.add('selected');
      pauseResumeManager.pause(pikaVolley, PauseResumePrecedence.pauseBtn);
    }
  });

  const restartBtn = document.getElementById('restart-btn');
  restartBtn.addEventListener('click', () => {
    if (pauseBtn.classList.contains('selected')) {
      pauseBtn.classList.remove('selected');
      pauseResumeManager.resume(pikaVolley, PauseResumePrecedence.pauseBtn);
    }
    pikaVolley.restart();
  });

  const bgmOnBtn = document.getElementById('bgm-on-btn');
  const bgmOffBtn = document.getElementById('bgm-off-btn');
  bgmOnBtn.addEventListener('click', () => {
    bgmOffBtn.classList.remove('selected');
    bgmOnBtn.classList.add('selected');
    pikaVolley.audio.turnBGMVolume(true);
  });
  bgmOffBtn.addEventListener('click', () => {
    bgmOnBtn.classList.remove('selected');
    bgmOffBtn.classList.add('selected');
    pikaVolley.audio.turnBGMVolume(false);
  });

  const stereoBtn = document.getElementById('stereo-btn');
  const monoBtn = document.getElementById('mono-btn');
  const sfxOffBtn = document.getElementById('sfx-off-btn');
  stereoBtn.addEventListener('click', () => {
    monoBtn.classList.remove('selected');
    sfxOffBtn.classList.remove('selected');
    stereoBtn.classList.add('selected');
    pikaVolley.audio.turnSFXVolume(true);
    pikaVolley.isStereoSound = true;
  });
  monoBtn.addEventListener('click', () => {
    sfxOffBtn.classList.remove('selected');
    stereoBtn.classList.remove('selected');
    monoBtn.classList.add('selected');
    pikaVolley.audio.turnSFXVolume(true);
    pikaVolley.isStereoSound = false;
  });
  sfxOffBtn.addEventListener('click', () => {
    stereoBtn.classList.remove('selected');
    monoBtn.classList.remove('selected');
    sfxOffBtn.classList.add('selected');
    pikaVolley.audio.turnSFXVolume(false);
  });

  // Game speed:
  //   slow: 1 frame per 50ms = 20 FPS
  //   medium: 1 frame per 40ms = 25 FPS
  //   fast: 1 frame per 33ms = 30.303030... FPS
  const slowSpeedBtn = document.getElementById('slow-speed-btn');
  const mediumSpeedBtn = document.getElementById('medium-speed-btn');
  const fastSpeedBtn = document.getElementById('fast-speed-btn');
  slowSpeedBtn.addEventListener('click', () => {
    mediumSpeedBtn.classList.remove('selected');
    fastSpeedBtn.classList.remove('selected');
    slowSpeedBtn.classList.add('selected');

    pikaVolley.normalFPS = 20;
    ticker.maxFPS = pikaVolley.normalFPS;
    replaySaver.recordOptions({
      speed: 'slow',
      winningScore: pikaVolley.winningScore,
    });
  });
  mediumSpeedBtn.addEventListener('click', () => {
    fastSpeedBtn.classList.remove('selected');
    slowSpeedBtn.classList.remove('selected');
    mediumSpeedBtn.classList.add('selected');

    pikaVolley.normalFPS = 25;
    ticker.maxFPS = pikaVolley.normalFPS;
    replaySaver.recordOptions({
      speed: 'medium',
      winningScore: pikaVolley.winningScore,
    });
  });
  fastSpeedBtn.addEventListener('click', () => {
    slowSpeedBtn.classList.remove('selected');
    mediumSpeedBtn.classList.remove('selected');
    fastSpeedBtn.classList.add('selected');

    pikaVolley.normalFPS = 30;
    ticker.maxFPS = pikaVolley.normalFPS;
    replaySaver.recordOptions({
      speed: 'fast',
      winningScore: pikaVolley.winningScore,
    });
  });

  const winningScore5Btn = document.getElementById('winning-score-5-btn');
  const winningScore10Btn = document.getElementById('winning-score-10-btn');
  const winningScore15Btn = document.getElementById('winning-score-15-btn');
  const noticeBox1 = document.getElementById('notice-box-1');
  const noticeOKBtn1 = document.getElementById('notice-ok-btn-1');
  const winningScoreInNoticeBox1 = document.getElementById(
    'winning-score-in-notice-box-1'
  );
  function isWinningScoreAlreadyReached(winningScore) {
    const isGamePlaying =
      pikaVolley.state === pikaVolley.round ||
      pikaVolley.state === pikaVolley.afterEndOfRound ||
      pikaVolley.state === pikaVolley.beforeStartOfNextRound;
    if (
      isGamePlaying &&
      (pikaVolley.scores[0] >= winningScore ||
        pikaVolley.scores[1] >= winningScore)
    ) {
      return true;
    }
    return false;
  }
  const noticeBox2 = document.getElementById('notice-box-2');
  const noticeOKBtn2 = document.getElementById('notice-ok-btn-2');
  winningScore5Btn.addEventListener('click', () => {
    if (winningScore5Btn.classList.contains('selected')) {
      return;
    }
    if (pikaVolley.isPracticeMode === true) {
      noticeBox2.classList.remove('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = true;
      // @ts-ignore
      optionsDropdownBtn.disabled = true;
      // @ts-ignore
      serveModeDropdownBtn.disabled = true;
      // @ts-ignore
      aboutBtn.disabled = true;
      pauseResumeManager.pause(pikaVolley, PauseResumePrecedence.messageBox);
      return;
    }
    if (isWinningScoreAlreadyReached(5)) {
      winningScoreInNoticeBox1.textContent = '5';
      noticeBox1.classList.remove('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = true;
      // @ts-ignore
      optionsDropdownBtn.disabled = true;
      // @ts-ignore
      serveModeDropdownBtn.disabled = true;
      // @ts-ignore
      aboutBtn.disabled = true;
      pauseResumeManager.pause(pikaVolley, PauseResumePrecedence.messageBox);
      return;
    }
    winningScore10Btn.classList.remove('selected');
    winningScore15Btn.classList.remove('selected');
    winningScore5Btn.classList.add('selected');
    pikaVolley.winningScore = 5;
    replaySaver.recordOptions({
      speed:
        pikaVolley.normalFPS === 30
          ? 'fast'
          : pikaVolley.normalFPS === 25
          ? 'medium'
          : 'slow',
      winningScore: 5,
    });
  });
  winningScore10Btn.addEventListener('click', () => {
    if (winningScore10Btn.classList.contains('selected')) {
      return;
    }
    if (pikaVolley.isPracticeMode === true) {
      noticeBox2.classList.remove('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = true;
      // @ts-ignore
      optionsDropdownBtn.disabled = true;
      // @ts-ignore
      serveModeDropdownBtn.disabled = true;
      // @ts-ignore
      aboutBtn.disabled = true;
      pauseResumeManager.pause(pikaVolley, PauseResumePrecedence.messageBox);
      return;
    }
    if (isWinningScoreAlreadyReached(10)) {
      winningScoreInNoticeBox1.textContent = '10';
      noticeBox1.classList.remove('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = true;
      // @ts-ignore
      optionsDropdownBtn.disabled = true;
      // @ts-ignore
      serveModeDropdownBtn.disabled = true;
      // @ts-ignore
      aboutBtn.disabled = true;
      pauseResumeManager.pause(pikaVolley, PauseResumePrecedence.messageBox);
      return;
    }
    winningScore5Btn.classList.remove('selected');
    winningScore15Btn.classList.remove('selected');
    winningScore10Btn.classList.add('selected');
    pikaVolley.winningScore = 10;
    replaySaver.recordOptions({
      speed:
        pikaVolley.normalFPS === 30
          ? 'fast'
          : pikaVolley.normalFPS === 25
          ? 'medium'
          : 'slow',
      winningScore: 10,
    });
  });
  winningScore15Btn.addEventListener('click', () => {
    if (winningScore15Btn.classList.contains('selected')) {
      return;
    }
    if (pikaVolley.isPracticeMode === true) {
      noticeBox2.classList.remove('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = true;
      // @ts-ignore
      optionsDropdownBtn.disabled = true;
      // @ts-ignore
      serveModeDropdownBtn.disabled = true;
      // @ts-ignore
      aboutBtn.disabled = true;
      pauseResumeManager.pause(pikaVolley, PauseResumePrecedence.messageBox);
      return;
    }
    if (isWinningScoreAlreadyReached(15)) {
      winningScoreInNoticeBox1.textContent = '15';
      noticeBox1.classList.remove('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = true;
      // @ts-ignore
      optionsDropdownBtn.disabled = true;
      // @ts-ignore
      serveModeDropdownBtn.disabled = true;
      // @ts-ignore
      aboutBtn.disabled = true;
      pauseResumeManager.pause(pikaVolley, PauseResumePrecedence.messageBox);
      return;
    }
    winningScore5Btn.classList.remove('selected');
    winningScore10Btn.classList.remove('selected');
    winningScore15Btn.classList.add('selected');
    pikaVolley.winningScore = 15;
    replaySaver.recordOptions({
      speed:
        pikaVolley.normalFPS === 30
          ? 'fast'
          : pikaVolley.normalFPS === 25
          ? 'medium'
          : 'slow',
      winningScore: 15,
    });
  });
  noticeOKBtn1.addEventListener('click', () => {
    if (!noticeBox1.classList.contains('hidden')) {
      noticeBox1.classList.add('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = false;
      // @ts-ignore
      optionsDropdownBtn.disabled = false;
      // @ts-ignore
      serveModeDropdownBtn.disabled = false;
      // @ts-ignore
      aboutBtn.disabled = false;
      pauseResumeManager.resume(pikaVolley, PauseResumePrecedence.messageBox);
    }
  });
  noticeOKBtn2.addEventListener('click', () => {
    if (!noticeBox2.classList.contains('hidden')) {
      noticeBox2.classList.add('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = false;
      // @ts-ignore
      optionsDropdownBtn.disabled = false;
      // @ts-ignore
      serveModeDropdownBtn.disabled = false;
      // @ts-ignore
      aboutBtn.disabled = false;
      pauseResumeManager.resume(pikaVolley, PauseResumePrecedence.messageBox);
    }
  });

  const practiceModeOnBtn = document.getElementById('practice-mode-on-btn');
  const practiceModeOffBtn = document.getElementById('practice-mode-off-btn');
  practiceModeOnBtn.addEventListener('click', () => {
    practiceModeOffBtn.classList.remove('selected');
    practiceModeOnBtn.classList.add('selected');
    pikaVolley.isPracticeMode = true;
  });
  practiceModeOffBtn.addEventListener('click', () => {
    practiceModeOnBtn.classList.remove('selected');
    practiceModeOffBtn.classList.add('selected');
    pikaVolley.isPracticeMode = false;
  });

  const serveModeRandomBtn = document.getElementById('random-order-btn');
  const serveModeFixedBtn = document.getElementById('fixed-order-btn');
  serveModeRandomBtn.addEventListener('click', () => {
    serveModeFixedBtn.classList.remove('selected');
    serveModeRandomBtn.classList.add('selected');
    serveMode = 0;
  });
  serveModeFixedBtn.addEventListener('click', () => {
    serveModeRandomBtn.classList.remove('selected');
    serveModeFixedBtn.classList.add('selected');
    serveMode = 1;
  });

  function CountAvailable(avail) {
    return avail.filter((x) => x === true).length;
  }
  const player1Skill0Checkbox = document.getElementById(
    'player-1-skill-0-checkbox'
  );
  const player1Skill1Checkbox = document.getElementById(
    'player-1-skill-1-checkbox'
  );
  const player1Skill2Checkbox = document.getElementById(
    'player-1-skill-2-checkbox'
  );
  const player1Skill3Checkbox = document.getElementById(
    'player-1-skill-3-checkbox'
  );
  const player1Skill4Checkbox = document.getElementById(
    'player-1-skill-4-checkbox'
  );
  const player1Skill5Checkbox = document.getElementById(
    'player-1-skill-5-checkbox'
  );
  const player1Skill6Checkbox = document.getElementById(
    'player-1-skill-6-checkbox'
  );
  const player1Skill7Checkbox = document.getElementById(
    'player-1-skill-7-checkbox'
  );
  const player1Skill8Checkbox = document.getElementById(
    'player-1-skill-8-checkbox'
  );
  const player1Skill9Checkbox = document.getElementById(
    'player-1-skill-9-checkbox'
  );
  const player2Skill0Checkbox = document.getElementById(
    'player-2-skill-0-checkbox'
  );
  const player2Skill1Checkbox = document.getElementById(
    'player-2-skill-1-checkbox'
  );
  const player2Skill2Checkbox = document.getElementById(
    'player-2-skill-2-checkbox'
  );
  const player2Skill3Checkbox = document.getElementById(
    'player-2-skill-3-checkbox'
  );
  const player2Skill4Checkbox = document.getElementById(
    'player-2-skill-4-checkbox'
  );
  const player2Skill5Checkbox = document.getElementById(
    'player-2-skill-5-checkbox'
  );
  const player2Skill6Checkbox = document.getElementById(
    'player-2-skill-6-checkbox'
  );
  const player2Skill7Checkbox = document.getElementById(
    'player-2-skill-7-checkbox'
  );
  // @ts-ignore
  player1Skill0Checkbox.checked = true;
  // @ts-ignore
  player1Skill1Checkbox.checked = true;
  // @ts-ignore
  player1Skill2Checkbox.checked = true;
  // @ts-ignore
  player1Skill3Checkbox.checked = true;
  // @ts-ignore
  player1Skill4Checkbox.checked = true;
  // @ts-ignore
  player1Skill5Checkbox.checked = true;
  // @ts-ignore
  player1Skill6Checkbox.checked = true;
  // @ts-ignore
  player1Skill7Checkbox.checked = true;
  // @ts-ignore
  player1Skill8Checkbox.checked = true;
  // @ts-ignore
  player1Skill9Checkbox.checked = true;
  // @ts-ignore
  player2Skill0Checkbox.checked = true;
  // @ts-ignore
  player2Skill1Checkbox.checked = true;
  // @ts-ignore
  player2Skill2Checkbox.checked = true;
  // @ts-ignore
  player2Skill3Checkbox.checked = true;
  // @ts-ignore
  player2Skill4Checkbox.checked = true;
  // @ts-ignore
  player2Skill5Checkbox.checked = true;
  // @ts-ignore
  player2Skill6Checkbox.checked = true;
  // @ts-ignore
  player2Skill7Checkbox.checked = true;
  player1Skill0Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill0Checkbox.checked === true)
      SkillTypeForPlayer1Available[0] = true;
    // @ts-ignore
    else if (player1Skill0Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[0] = false;
      // @ts-ignore
      else player1Skill0Checkbox.checked = true;
    }
  });
  player1Skill1Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill1Checkbox.checked === true)
      SkillTypeForPlayer1Available[1] = true;
    // @ts-ignore
    else if (player1Skill1Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[1] = false;
      // @ts-ignore
      else player1Skill1Checkbox.checked = true;
    }
  });
  player1Skill2Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill2Checkbox.checked === true)
      SkillTypeForPlayer1Available[2] = true;
    // @ts-ignore
    else if (player1Skill2Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[2] = false;
      // @ts-ignore
      else player1Skill2Checkbox.checked = true;
    }
  });
  player1Skill3Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill3Checkbox.checked === true)
      SkillTypeForPlayer1Available[3] = true;
    // @ts-ignore
    else if (player1Skill3Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[3] = false;
      // @ts-ignore
      else player1Skill3Checkbox.checked = true;
    }
  });
  player1Skill4Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill4Checkbox.checked === true)
      SkillTypeForPlayer1Available[4] = true;
    // @ts-ignore
    else if (player1Skill4Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[4] = false;
      // @ts-ignore
      else player1Skill4Checkbox.checked = true;
    }
  });
  player1Skill5Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill5Checkbox.checked === true)
      SkillTypeForPlayer1Available[5] = true;
    // @ts-ignore
    else if (player1Skill5Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[5] = false;
      // @ts-ignore
      else player1Skill5Checkbox.checked = true;
    }
  });
  player1Skill6Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill6Checkbox.checked === true)
      SkillTypeForPlayer1Available[6] = true;
    // @ts-ignore
    else if (player1Skill6Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[6] = false;
      // @ts-ignore
      else player1Skill6Checkbox.checked = true;
    }
  });
  player1Skill7Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill7Checkbox.checked === true)
      SkillTypeForPlayer1Available[7] = true;
    // @ts-ignore
    else if (player1Skill7Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[7] = false;
      // @ts-ignore
      else player1Skill7Checkbox.checked = true;
    }
  });
  player1Skill8Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill8Checkbox.checked === true)
      SkillTypeForPlayer1Available[8] = true;
    // @ts-ignore
    else if (player1Skill8Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[8] = false;
      // @ts-ignore
      else player1Skill8Checkbox.checked = true;
    }
  });
  player1Skill9Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player1Skill9Checkbox.checked === true)
      SkillTypeForPlayer1Available[9] = true;
    // @ts-ignore
    else if (player1Skill9Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer1Available) >= 2)
        SkillTypeForPlayer1Available[9] = false;
      // @ts-ignore
      else player1Skill9Checkbox.checked = true;
    }
  });
  player2Skill0Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player2Skill0Checkbox.checked === true)
      SkillTypeForPlayer2Available[0] = true;
    // @ts-ignore
    else if (player2Skill0Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer2Available) >= 2)
        SkillTypeForPlayer2Available[0] = false;
      // @ts-ignore
      else player2Skill0Checkbox.checked = true;
    }
  });
  player2Skill1Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player2Skill1Checkbox.checked === true)
      SkillTypeForPlayer2Available[1] = true;
    // @ts-ignore
    else if (player2Skill1Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer2Available) >= 2)
        SkillTypeForPlayer2Available[1] = false;
      // @ts-ignore
      else player2Skill1Checkbox.checked = true;
    }
  });
  player2Skill2Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player2Skill2Checkbox.checked === true)
      SkillTypeForPlayer2Available[2] = true;
    // @ts-ignore
    else if (player2Skill2Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer2Available) >= 2)
        SkillTypeForPlayer2Available[2] = false;
      // @ts-ignore
      else player2Skill2Checkbox.checked = true;
    }
  });
  player2Skill3Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player2Skill3Checkbox.checked === true)
      SkillTypeForPlayer2Available[3] = true;
    // @ts-ignore
    else if (player2Skill3Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer2Available) >= 2)
        SkillTypeForPlayer2Available[3] = false;
      // @ts-ignore
      else player2Skill3Checkbox.checked = true;
    }
  });
  player2Skill4Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player2Skill4Checkbox.checked === true)
      SkillTypeForPlayer2Available[4] = true;
    // @ts-ignore
    else if (player2Skill4Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer2Available) >= 2)
        SkillTypeForPlayer2Available[4] = false;
      // @ts-ignore
      else player2Skill4Checkbox.checked = true;
    }
  });
  player2Skill5Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player2Skill5Checkbox.checked === true)
      SkillTypeForPlayer2Available[5] = true;
    // @ts-ignore
    else if (player2Skill5Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer2Available) >= 2)
        SkillTypeForPlayer2Available[5] = false;
      // @ts-ignore
      else player2Skill5Checkbox.checked = true;
    }
  });
  player2Skill6Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player2Skill6Checkbox.checked === true)
      SkillTypeForPlayer2Available[6] = true;
    // @ts-ignore
    else if (player2Skill6Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer2Available) >= 2)
        SkillTypeForPlayer2Available[6] = false;
      // @ts-ignore
      else player2Skill6Checkbox.checked = true;
    }
  });
  player2Skill7Checkbox.addEventListener('change', () => {
    // @ts-ignore
    if (player2Skill7Checkbox.checked === true)
      SkillTypeForPlayer2Available[7] = true;
    // @ts-ignore
    else if (player2Skill7Checkbox.checked === false) {
      if (CountAvailable(SkillTypeForPlayer2Available) >= 2)
        SkillTypeForPlayer2Available[7] = false;
      // @ts-ignore
      else player2Skill7Checkbox.checked = true;
    }
  });

  for (var key in capability) {
    (function (key) {
      document.getElementById(key).addEventListener('change', () => {
        // console.log(key);
        // @ts-ignore
        capability[key] = document.getElementById(key).checked;
      });
    })(key);
  }

  document.getElementById('defense').addEventListener('change', () => {
    // @ts-ignore
    defense = parseInt(document.getElementById('defense').value);
  });

  document.getElementById('delay').addEventListener('change', () => {
    // console.log(key);
    // @ts-ignore
    delay = document.getElementById('delay').value;
  });

  const player1_1_step = document.getElementById('player1-1-step-serve');
  player1_1_step.addEventListener('change', () => {
    // @ts-ignore
    player1Skill0Checkbox.checked = player1_1_step.checked;
    // @ts-ignore
    player1Skill1Checkbox.checked = player1_1_step.checked;
    // @ts-ignore
    player1Skill2Checkbox.checked = player1_1_step.checked;
    // @ts-ignore
    player1Skill3Checkbox.checked = player1_1_step.checked;
    // @ts-ignore
    player1Skill4Checkbox.checked = player1_1_step.checked;
    // @ts-ignore
    player1Skill5Checkbox.checked = player1_1_step.checked;
    // @ts-ignore
    player1Skill6Checkbox.checked = player1_1_step.checked;
    // @ts-ignore
    player1Skill7Checkbox.checked = player1_1_step.checked;
    for (let i = 0; i < 8; i++) {
      // @ts-ignore
      SkillTypeForPlayer1Available[i] = player1_1_step.checked;
    }
    if (CountAvailable(SkillTypeForPlayer1Available) === 0) {
      // @ts-ignore
      player1Skill1Checkbox.checked = true;
      SkillTypeForPlayer1Available[1] = true;
    }
  });

  const player2_1_step = document.getElementById('player2-1-step-serve');
  player2_1_step.addEventListener('change', () => {
    // @ts-ignore
    player2Skill0Checkbox.checked = player2_1_step.checked;
    // @ts-ignore
    player2Skill1Checkbox.checked = player2_1_step.checked;
    // @ts-ignore
    player2Skill2Checkbox.checked = player2_1_step.checked;
    // @ts-ignore
    player2Skill3Checkbox.checked = player2_1_step.checked;
    // @ts-ignore
    player2Skill4Checkbox.checked = player2_1_step.checked;
    // @ts-ignore
    player2Skill5Checkbox.checked = player2_1_step.checked;
    for (let i = 0; i < 6; i++) {
      // @ts-ignore
      SkillTypeForPlayer2Available[i] = player2_1_step.checked;
    }
    if (CountAvailable(SkillTypeForPlayer2Available) === 0) {
      // @ts-ignore
      player2Skill1Checkbox.checked = true;
      SkillTypeForPlayer2Available[1] = true;
    }
  });

  const player1_tail = document.getElementById('player1-tail-serve');
  player1_tail.addEventListener('change', () => {
    // @ts-ignore
    player1Skill8Checkbox.checked = player1_tail.checked;
    // @ts-ignore
    player1Skill9Checkbox.checked = player1_tail.checked;
    for (let i = 8; i < 10; i++) {
      // @ts-ignore
      SkillTypeForPlayer1Available[i] = player1_tail.checked;
    }
    if (CountAvailable(SkillTypeForPlayer1Available) === 0) {
      // @ts-ignore
      player1Skill1Checkbox.checked = true;
      SkillTypeForPlayer1Available[1] = true;
    }
  });

  const player2_tail = document.getElementById('player2-tail-serve');
  player2_tail.addEventListener('change', () => {
    // @ts-ignore
    player2Skill6Checkbox.checked = player2_tail.checked;
    // @ts-ignore
    player2Skill7Checkbox.checked = player2_tail.checked;
    for (let i = 6; i < 8; i++) {
      // @ts-ignore
      SkillTypeForPlayer2Available[i] = player2_tail.checked;
    }
    if (CountAvailable(SkillTypeForPlayer2Available) === 0) {
      // @ts-ignore
      player2Skill1Checkbox.checked = true;
      SkillTypeForPlayer2Available[1] = true;
    }
  });

  const saveReplayBtn = document.getElementById('save-replay-btn');
  saveReplayBtn.addEventListener('click', () => {
    replaySaver.saveAsFile();
  });

  const aboutBox = document.getElementById('about-box');
  const closeAboutBtn = document.getElementById('close-about-btn');
  aboutBtn.addEventListener('click', () => {
    if (aboutBox.classList.contains('hidden')) {
      aboutBox.classList.remove('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = true;
      // @ts-ignore
      optionsDropdownBtn.disabled = true;
      // @ts-ignore
      serveModeDropdownBtn.disabled = true;
      pauseResumeManager.pause(pikaVolley, PauseResumePrecedence.messageBox);
    } else {
      aboutBox.classList.add('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = false;
      // @ts-ignore
      optionsDropdownBtn.disabled = false;
      // @ts-ignore
      serveModeDropdownBtn.disabled = false;
      pauseResumeManager.resume(pikaVolley, PauseResumePrecedence.messageBox);
    }
  });
  closeAboutBtn.addEventListener('click', () => {
    if (!aboutBox.classList.contains('hidden')) {
      aboutBox.classList.add('hidden');
      // @ts-ignore
      gameDropdownBtn.disabled = false;
      // @ts-ignore
      optionsDropdownBtn.disabled = false;
      // @ts-ignore
      serveModeDropdownBtn.disabled = false;
      pauseResumeManager.resume(pikaVolley, PauseResumePrecedence.messageBox);
    }
  });
}

/**
 * Attach event listeners to show dropdowns and submenus properly
 * @param {PikachuVolleyball} pikaVolley
 */
function setUpToShowDropdownsAndSubmenus(pikaVolley) {
  // hide dropdowns and submenus if the user clicks outside of these
  window.addEventListener('click', (event) => {
    // @ts-ignore
    if (!event.target.matches('.dropdown-btn, .submenu-btn')) {
      hideSubmenus();
      hideDropdownsExcept('');
      pauseResumeManager.resume(pikaVolley, PauseResumePrecedence.dropdown);
    }
  });

  // set up to show dropdowns
  document.getElementById('game-dropdown-btn').addEventListener('click', () => {
    toggleDropdown('game-dropdown', pikaVolley);
  });
  document
    .getElementById('options-dropdown-btn')
    .addEventListener('click', () => {
      toggleDropdown('options-dropdown', pikaVolley);
    });
  document
    .getElementById('serve-mode-dropdown-btn')
    .addEventListener('click', () => {
      toggleDropdown('serve-mode-dropdown', pikaVolley);
    });
  // set up to show submenus on mouseover event
  document
    .getElementById('bgm-submenu-btn')
    .addEventListener('mouseover', () => {
      showSubmenu('bgm-submenu-btn', 'bgm-submenu');
    });
  document
    .getElementById('sfx-submenu-btn')
    .addEventListener('mouseover', () => {
      showSubmenu('sfx-submenu-btn', 'sfx-submenu');
    });
  document
    .getElementById('speed-submenu-btn')
    .addEventListener('mouseover', () => {
      showSubmenu('speed-submenu-btn', 'speed-submenu');
    });
  document
    .getElementById('winning-score-submenu-btn')
    .addEventListener('mouseover', () => {
      showSubmenu('winning-score-submenu-btn', 'winning-score-submenu');
    });
  document
    .getElementById('practice-mode-submenu-btn')
    .addEventListener('mouseover', () => {
      showSubmenu('practice-mode-submenu-btn', 'practice-mode-submenu');
    });
  /*
  document
    .getElementById('serve-mode-submenu-btn')
    .addEventListener('mouseover', () => {
      showSubmenu('serve-mode-submenu-btn', 'serve-mode-submenu');
    });
  */
  // set up to show submenus on click event
  // (it is for touch device equipped with physical keyboard)
  document.getElementById('bgm-submenu-btn').addEventListener('click', () => {
    showSubmenu('bgm-submenu-btn', 'bgm-submenu');
  });
  document.getElementById('sfx-submenu-btn').addEventListener('click', () => {
    showSubmenu('sfx-submenu-btn', 'sfx-submenu');
  });
  document.getElementById('speed-submenu-btn').addEventListener('click', () => {
    showSubmenu('speed-submenu-btn', 'speed-submenu');
  });
  document
    .getElementById('winning-score-submenu-btn')
    .addEventListener('click', () => {
      showSubmenu('winning-score-submenu-btn', 'winning-score-submenu');
    });
  document
    .getElementById('practice-mode-submenu-btn')
    .addEventListener('click', () => {
      showSubmenu('practice-mode-submenu-btn', 'practice-mode-submenu');
    });
  /*
  document
    .getElementById('serve-mode-submenu-btn')
    .addEventListener('click', () => {
      showSubmenu('serve-mode-submenu-btn', 'serve-mode-submenu');
    });
  */
}

/**
 * Toggle (show or hide) the dropdown menu
 * @param {string} dropdownID html element id of the dropdown to toggle
 * @param {PikachuVolleyball} pikaVolley
 */
function toggleDropdown(dropdownID, pikaVolley) {
  hideSubmenus();
  hideDropdownsExcept(dropdownID);
  const willShow = document.getElementById(dropdownID).classList.toggle('show');
  if (willShow) {
    pauseResumeManager.pause(pikaVolley, PauseResumePrecedence.dropdown);
  } else {
    pauseResumeManager.resume(pikaVolley, PauseResumePrecedence.dropdown);
  }
}

/**
 * Show the submenu
 * @param {string} submenuBtnID html element id of the submenu button whose submenu to show
 * @param {string} subMenuID html element id of the submenu to show
 */
function showSubmenu(submenuBtnID, subMenuID) {
  hideSubmenus();
  document.getElementById(submenuBtnID).classList.add('open');
  document.getElementById(subMenuID).classList.add('show');
}

/**
 * Hide all other dropdowns except the dropdown
 * @param {string} dropdownID html element id of the dropdown
 */
function hideDropdownsExcept(dropdownID) {
  const dropdowns = document.getElementsByClassName('dropdown');
  for (let i = 0; i < dropdowns.length; i++) {
    if (dropdowns[i].id !== dropdownID) {
      dropdowns[i].classList.remove('show');
    }
  }
}

/**
 * Hide all submenus
 */
function hideSubmenus() {
  const submenus = document.getElementsByClassName('submenu');
  for (let i = 0; i < submenus.length; i++) {
    submenus[i].classList.remove('show');
  }
  const submenuBtns = document.getElementsByClassName('submenu-btn');
  for (let i = 0; i < submenuBtns.length; i++) {
    submenuBtns[i].classList.remove('open');
  }
}
