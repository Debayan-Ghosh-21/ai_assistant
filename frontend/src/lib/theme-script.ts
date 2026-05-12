// This script runs before React hydration to prevent theme flash
export const themeScript = `
(function() {
  try {
    var effectiveTheme = 'light';
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(effectiveTheme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  } catch (e) {
    // Fallback to light theme
    document.documentElement.classList.add('light');
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`
