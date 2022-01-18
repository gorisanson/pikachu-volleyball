'use strict';

/**
 * Check if the page is embedded in other site.
 * Copied from: https://stackoverflow.com/a/326076/8581025
 */
const isEmbeddedInOtherWebsite = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

if (isEmbeddedInOtherWebsite()) {
  document
    .getElementById('flex-container')
    .classList.add('embedded-in-other-website');
  Array.from(
    document.getElementsByClassName('if-embedded-in-other-website')
  ).forEach((elem) => elem.classList.remove('hidden'));
  Array.from(
    document.querySelectorAll('.if-embedded-in-other-website button')
  ).forEach((elem) =>
    elem.addEventListener('click', () => {
      Array.from(
        document.getElementsByClassName('if-embedded-in-other-website')
      ).forEach((elem) => elem.classList.add('hidden'));
    })
  );
}
