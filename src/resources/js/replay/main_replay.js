import { ASSETS_PATH } from '../assets_path.js';
import { setUpUI } from './ui_replay.js';

adjustAssetsPath();
setUpUI();

/**
 * Adjust game assets path to the path from the perspective of en/replay/index.html
 */
function adjustAssetsPath() {
  ASSETS_PATH.SPRITE_SHEET = '../' + ASSETS_PATH.SPRITE_SHEET;
  for (const prop in ASSETS_PATH.SOUNDS) {
    ASSETS_PATH.SOUNDS[prop] = '../' + ASSETS_PATH.SOUNDS[prop];
  }
}
