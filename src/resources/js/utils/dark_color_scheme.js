'use strict';
const THEME_COLOR_LIGHT = '#FFFFFF';
const THEME_COLOR_DARK = '#202124';

setUpDarkColorSchemeCheckbox();

/**
 * Set up dark color scheme checkbox
 */
function setUpDarkColorSchemeCheckbox() {
  const darkColorSchemeCheckboxElements = Array.from(
    document.getElementsByClassName('dark-color-scheme-checkbox')
  );
  let colorScheme = null;
  try {
    colorScheme = window.localStorage.getItem('colorScheme');
  } catch (err) {
    console.error(err);
  }
  if (colorScheme === 'dark' || colorScheme === 'light') {
    darkColorSchemeCheckboxElements.forEach((elem) => {
      // @ts-ignore
      elem.checked = colorScheme === 'dark';
    });
    applyColorScheme(colorScheme);
  } else {
    const doesPreferDarkColorScheme = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    // The following line is not for "document.documentElement.dataset.colorScheme = colorScheme;".
    // document.documentElement.dataset.colorShceme is not needed to be set for displaying dark color scheme,
    // since style.css has media query "@media (prefers-color-scheme: dark)" which deals with it without JavaScript.
    // The following line is for setting theme color and etc...
    applyColorScheme(doesPreferDarkColorScheme ? 'dark' : 'light');
    darkColorSchemeCheckboxElements.forEach((elem) => {
      // @ts-ignore
      elem.checked = doesPreferDarkColorScheme;
    });
  }
  darkColorSchemeCheckboxElements.forEach((elem) => {
    elem.addEventListener('change', () => {
      // @ts-ignore
      const colorScheme = elem.checked ? 'dark' : 'light';
      applyColorScheme(colorScheme);
      try {
        window.localStorage.setItem('colorScheme', colorScheme);
      } catch (err) {
        console.error(err);
      }
      // For syncing states of other checkbox elements
      darkColorSchemeCheckboxElements.forEach((element) => {
        if (element !== elem) {
          // @ts-ignore
          element.checked = elem.checked;
        }
      });
    });
  });
}

/**
 * Apply color scheme. (Display color scheme to the screen.)
 * @param {string} colorScheme 'dark' or 'light'
 */
function applyColorScheme(colorScheme) {
  document.documentElement.dataset.colorScheme = colorScheme;
  const themeColorMetaElement = document.querySelector(
    'meta[name="theme-color"]'
  );
  if (themeColorMetaElement !== null) {
    // The line below is for the status bar color, which is set by theme-color
    // meta tag content, of PWA in Apple devices.
    themeColorMetaElement.setAttribute(
      'content',
      colorScheme === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT
    );
  }
}
