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
    document.documentElement.dataset.colorScheme = colorScheme;
  } else {
    darkColorSchemeCheckboxElements.forEach((elem) => {
      // @ts-ignore
      elem.checked =
        colorScheme ===
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
  }
  darkColorSchemeCheckboxElements.forEach((elem) => {
    elem.addEventListener('change', () => {
      // @ts-ignore
      const colorScheme = elem.checked ? 'dark' : 'light';
      document.documentElement.dataset.colorScheme = colorScheme;
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
