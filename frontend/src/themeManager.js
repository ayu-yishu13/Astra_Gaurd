// src/themeManager.js
export function applySavedTheme() {
  const saved = JSON.parse(localStorage.getItem("nidsSettings"));
  const theme = saved?.theme || "Cyber Blue";
  const body = document.body;

  body.classList.remove("theme-cyber", "theme-crimson", "theme-emerald", "theme-default");

  switch (theme) {
    case "Cyber Blue":
      body.classList.add("theme-cyber");
      break;
    case "Crimson Dark":
      body.classList.add("theme-crimson");
      break;
    case "Emerald Matrix":
      body.classList.add("theme-emerald");
      break;
    default:
      body.classList.add("theme-default");
  }
}
