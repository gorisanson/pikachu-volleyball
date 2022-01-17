setUpDarkColorSchemeCheckbox();

/**
 * Set up dark color scheme checkbox
 */
function setUpDarkColorSchemeCheckbox() {
  const darkColorSchemeCheckboxElem = document.getElementById(
    'dark-color-scheme-checkbox'
  );
  let colorScheme = null;
  try {
    colorScheme = window.localStorage.getItem('colorScheme');
  } catch (err) {
    console.error(err);
  }
  if (colorScheme === 'dark' || colorScheme === 'light') {
    // @ts-ignore
    darkColorSchemeCheckboxElem.checked = colorScheme === 'dark';
    document.documentElement.dataset.colorScheme = colorScheme;
  } else {
    // @ts-ignore
    darkColorSchemeCheckboxElem.checked = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
  }
  darkColorSchemeCheckboxElem.addEventListener('change', () => {
    // @ts-ignore
    const colorScheme = darkColorSchemeCheckboxElem.checked ? 'dark' : 'light';
    document.documentElement.dataset.colorScheme = colorScheme;
    try {
      window.localStorage.setItem('colorScheme', colorScheme);
    } catch (err) {
      console.error(err);
    }
  });
}
