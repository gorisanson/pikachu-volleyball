'use strict';

/**
 * Return positive modulo n % m
 * @param {number} n
 * @param {number} m
 */
export function mod(n, m) {
  return ((n % m) + m) % m;
}

/**
 * is n in the range [n1, n2] modulo m
 * @param {number} n
 * @param {number} n1
 * @param {number} n2
 * @param {number} m
 */
export function isInModRange(n, n1, n2, m) {
  const _n = mod(n, m);
  const _n1 = mod(n1, m);
  const _n2 = mod(n2, m);
  if (_n1 <= _n2) {
    if (mod(n1, m) <= _n && _n <= mod(n2, m)) {
      return true;
    }
  } else {
    if (mod(n1, m) <= _n || _n <= mod(n2, m)) {
      return true;
    }
  }
  return false;
}
