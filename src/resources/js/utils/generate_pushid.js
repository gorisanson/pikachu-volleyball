/**
 * This code is originated from a gist https://gist.github.com/mikelehen/3596a30bd69384624c11
 * I found the gist link at https://firebase.googleblog.com/2015/02/the-2120-ways-to-ensure-unique_68.html
 *
 * Modified the origianl code somewhat so that the generated id can be easilly distinguishable by human eye.
 */
'use strict';

/**
 * Fancy ID generator that creates 20-character string identifiers with the following properties:
 *
 * 1. They're based on timestamp so that they sort *after* any existing ids.
 * 2. They contain 50-bits of random data after the timestamp so that IDs won't collide with other clients' IDs.
 * 3. They sort *lexicographically* (so the timestamp is converted to characters that will sort properly).
 * 4. They're monotonically increasing.  Even if you generate more than one in the same timestamp, the
 *    latter ones will sort after the former ones.  We do this by using the previous random bits
 *    but "incrementing" them by 1 (only in the case of a timestamp collision).
 */
export const generatePushID = (function () {
  // Modeled after base32 web-safe chars, but ordered by ASCII.
  const PUSH_CHARS = '23456789abcdefghijkmnpqrstuvwxyz';

  // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
  let lastPushTime = 0;

  // We generate 50-bits of randomness which get turned into 10 characters (since 32 === 2^5, (2^5)^10 === 2^50 )
  // and appended to the timestamp to prevent collisions with other clients. We store the last characters we
  // generated because in the event of a collision, we'll use those same characters except
  // "incremented" by one.
  const lastRandChars = [];

  return function () {
    let now = Date.now();
    const duplicateTime = now === lastPushTime;
    lastPushTime = now;

    const timeStampChars = new Array(10);
    for (let i = 9; i >= 0; i--) {
      timeStampChars[i] = PUSH_CHARS.charAt(now % 32);
      // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
      now = Math.floor(now / 32);
    }
    if (now !== 0)
      throw new Error('We should have converted the entire timestamp.');

    let id = timeStampChars.join('');

    if (!duplicateTime) {
      for (let i = 0; i < 10; i++) {
        lastRandChars[i] = Math.floor(Math.random() * 32);
      }
    } else {
      // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
      let i;
      for (i = 9; i >= 0 && lastRandChars[i] === 31; i--) {
        lastRandChars[i] = 0;
      }
      lastRandChars[i]++;
    }
    for (let i = 0; i < 10; i++) {
      id += PUSH_CHARS.charAt(lastRandChars[i]);
    }
    if (id.length !== 20) throw new Error('Length should be 20.');

    return id;
  };
})();
