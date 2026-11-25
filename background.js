const AI_DOMAINS = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
  "perplexity.ai",
  "copilot.microsoft.com",
  "poe.com",
  "deepseek.com",
  "quillbot.com",
];

const DEFAULT_STATE = {
  isMonitoring: false,
  studentName: "",
  courseSection: "",
  proctorEmail: "",
  flagAiSites: true,
  startedAt: null,
  events: [],
  visitedUrls: [],
};

let writeQueue = Promise.resolve();
let lastHost = "";
let lastHostTime = 0;
let lastTabSwitchTime = 0;
let lastAppSwitchTime = 0;

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get("session");
  if (!existing.session) {
    await chrome.storage.local.set({ session: DEFAULT_STATE });
  }
});

function logEvent(type, detail, isAiFlag = false, host = null) {
  const now = Date.now();

  if (type !== "APP_SWITCH") {
    lastTabSwitchTime = now;
  }

  if (host) {
    if (host === lastHost && now - lastHostTime < 2000) {
      return writeQueue;
    }
    lastHost = host;
    lastHostTime = now;
  }

  writeQueue = writeQueue.then(async () => {
    const { session } = await chrome.storage.local.get("session");
    if (!session || !session.isMonitoring) return;

    if (host && !session.visitedUrls.includes(host)) {
      session.visitedUrls.push(host);
    }

    const entry = {
      id: Date.now() + Math.random().toString(36).slice(2, 6),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      timestamp: Date.now(),
      type,
      detail,
      isAiFlag,
    };

    session.events.unshift(entry);
    await chrome.storage.local.set({ session });
  });

  return writeQueue;
}

function classifyUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!url.protocol.startsWith("http")) return null;
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const matchedAi = AI_DOMAINS.find(
      (domain) => host === domain || host.endsWith("." + domain),
    );
    return { host, fullUrl: rawUrl, isAi: Boolean(matchedAi) };
  } catch {
    return null;
  }
}

// 1. Track switching between existing tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  lastTabSwitchTime = Date.now();
  const { session } = await chrome.storage.local.get("session");
  if (!session || !session.isMonitoring) return;

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    const info = classifyUrl(tab.url || "");
    if (!info) return;

    if (info.isAi && session.flagAiSites) {
      await logEvent(
        "AI_SITE",
        `Switched to AI tool: ${info.host}`,
        true,
        info.host,
      );
    } else {
      await logEvent(
        "TAB_SWITCH",
        `Switched tab → ${info.host}`,
        false,
        info.host,
      );
    }
  } catch {
    // Ignore transient tab query errors
  }
});

// 2. Track navigating to a new site inside the current tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url || !tab.active) return;
  const { session } = await chrome.storage.local.get("session");
  if (!session || !session.isMonitoring) return;

  const info = classifyUrl(tab.url);
  if (!info) return;

  if (info.isAi && session.flagAiSites) {
    await logEvent(
      "AI_SITE",
      `Opened AI website: ${info.host}`,
      true,
      info.host,
    );
  } else {
    await logEvent("URL_VISIT", `Visited: ${info.host}`, false, info.host);
  }
});

// Replace the bottom chrome.runtime.onMessage listener in background.js with this:
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "START_MONITORING") {
    // Inject content.js into all already-open tabs so Alt+Tab works immediately without F5
    chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }).then((tabs) => {
      for (const tab of tabs) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: ["content.js"],
          })
          .catch(() => {});
      }
    });
    return;
  }

  if (msg.type === "PAGE_BLUR" && sender.tab?.active) {
    const now = Date.now();
    // Ignore post-load iframe focus shifts on AI sites within 2.5s of a tab/page event
    if (now - lastTabSwitchTime < 2500) return;
    if (now - lastAppSwitchTime < 2000) return;

    lastAppSwitchTime = now;
    logEvent("APP_SWITCH", "Switched outside browser (Alt+Tab / Cmd+Tab)");
  }
});
