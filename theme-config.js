/* Preset Vice City berdiri sendiri dan selalu memakai tampilan gelap. */
var savedVisualPreset = "";
try {
  savedVisualPreset = localStorage.getItem("sarbagita-visual-preset") || "";
} catch (e) {}
var initialVisualPreset = savedVisualPreset === "vice-city" ? "vice-city" : "classic";
window.SGT_THEME_CONFIG = { visualPreset: initialVisualPreset };
document.documentElement.setAttribute("data-visual-preset", initialVisualPreset);
