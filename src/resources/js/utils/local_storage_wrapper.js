export const localStorageWrapper = {
  /**
   * Get value corresponding to the key from localStorage
   * @param {string} key
   * @returns {string|null}
   */
  get: (key) => {
    let value = null;
    try {
      value = localStorage.getItem(key);
    } catch (err) {
      console.error(err);
    }
    return value;
  },

  /*
   * Set key-value pair to the localStorage
   * @param {string} key
   * @param {string} value
   */
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error(err);
    }
  },
};
