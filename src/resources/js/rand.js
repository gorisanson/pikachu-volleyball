/**
 * This module contains random number generator used for the game
 */
'use strict';
/** @typedef {function():number} RNG */

/** @type {RNG} custom RNG (random number generator) function which generates a random number in [0, 1] */
let customRng = null;

/**
 * Return random integer in [0, 32767]
 *
 * The machine code of the original game use "_rand()" function in Visual Studio 1988 Library.
 * I could't find out how this function works exactly.
 * But, anyhow, it should be a funtion that generate a random number.
 * I decided to use custom rand function which generates random integer in [0, 32767]
 * which follows rand() function in Visual Studio 2017 Library.
 *
 * By default, it uses the function "Math.random" for generating a random number.
 * A custom RNG function can used by setting the "customRng" as the custom RNG function.
 *
 * @return {number} random integer
 */
export function rand() {
  if (customRng === null) {
    return Math.floor(32768 * Math.random());
  }
  return Math.floor(32768 * customRng());
}

/**
 * Set custom RNG function
 * @param {RNG} rng
 */
export function setCustomRng(rng) {
  customRng = rng;
}

/**
 *
 * @return {number} random integer
 */
export function true_rand() {
  return Math.floor(32768 * Math.random());
}
