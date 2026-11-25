if (window === window.top && !window.__cheatShieldV3) {
  window.__cheatShieldV3 = true;
  let isBlurred = false;

  window.addEventListener("blur", () => {
    setTimeout(() => {
      const activeTag = document.activeElement?.tagName;
      const inEmbeddedFrame =
        activeTag === "IFRAME" ||
        activeTag === "WEBVIEW" ||
        activeTag === "OBJECT";

      if (
        document.visibilityState === "visible" &&
        !document.hasFocus() &&
        !inEmbeddedFrame &&
        !isBlurred
      ) {
        isBlurred = true;
        chrome.runtime.sendMessage({ type: "PAGE_BLUR" }).catch(() => {});
      }
    }, 400);
  });

  window.addEventListener("focus", () => {
    isBlurred = false;
  });
}
