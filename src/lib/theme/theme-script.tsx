import React from "react";

type Theme = "dark" | "light";

declare global {
  interface Window {
    __theme: Theme;
    __onThemeChange: (theme: Theme) => void;
    __setPreferredTheme: (theme: Theme) => void;
  }
}

const themeScript = `(function(){
  var k="__PREFERRED_THEME__";
  window.__onThemeChange=function(){};
  function s(t){
    document.documentElement.classList.remove(window.__theme);
    window.__theme=t;
    document.documentElement.dataset.theme=t;
    window.__onThemeChange(t);
    document.documentElement.classList.add(t);
  }
  var p;
  try{p=localStorage.getItem(k)}catch(e){}
  window.__setPreferredTheme=function(t){
    s(t);
    try{localStorage.setItem(k,t)}catch(e){}
  };
  var q=window.matchMedia("(prefers-color-scheme: dark)");
  q.addEventListener("change",function(e){
    window.__setPreferredTheme(e.matches?"dark":"light");
  });
  s(p||(q.matches?"dark":"light"));
})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
