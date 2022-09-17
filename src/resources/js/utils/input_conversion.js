import { PikaUserInput } from '../physics.js';

/**
 * Convert PikaUserInput object to a 5-bit number.
 *
 * Input is converted to 5-bit number (so fit in 1 byte = 8 bits).
 * input.xDirection: 2bits. 0: 00, 1: 01, -1: 11.
 * input.yDirection: 2bits. 0: 00, 1: 01, -1: 11.
 * input.powerHit: 1bits. 0: 0, 1: 1.
 * The bits order is input.powerHit, input.yDirection, input.xDirection.
 *
 * @param {PikaUserInput} input PikaUserInput object
 * @return {number} 5-bit number
 */
export function convertUserInputTo5bitNumber(input) {
  let n = 0;
  switch (input.xDirection) {
    case 1:
      n += 1;
      break;
    case -1:
      n += (1 << 1) + 1;
      break;
  }
  switch (input.yDirection) {
    case 1:
      n += 1 << 2;
      break;
    case -1:
      n += (1 << 3) + (1 << 2);
      break;
  }
  switch (input.powerHit) {
    case 1:
      n += 1 << 4;
      break;
  }
  return n;
}

/**
 * Convert 5-bit number to PikaUserInput object
 * @param {number} n 5-bit number
 */
export function convert5bitNumberToUserInput(n) {
  const input = new PikaUserInput();
  switch (n % (1 << 2)) {
    case 0:
      input.xDirection = 0;
      break;
    case 1:
      input.xDirection = 1;
      break;
    case 3:
      input.xDirection = -1;
      break;
  }
  switch ((n >>> 2) % (1 << 2)) {
    case 0:
      input.yDirection = 0;
      break;
    case 1:
      input.yDirection = 1;
      break;
    case 3:
      input.yDirection = -1;
      break;
  }
  input.powerHit = n >>> 4;
  return input;
}
