/**
 * Get hashCode for the string.
 * Refered from: https://stackoverflow.com/a/7616484/8581025
 * (original source: https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/)
 *
 * @param {string} s
 */
export function getHashCode(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
