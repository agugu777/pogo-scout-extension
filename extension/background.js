const ALARM_NAME = "pogo-scout-search";
const SEARCH_URL = "https://pogocoordinates.com/search";
const defaults = { interval: 3, intervalMode: "preset", customValue: 1, customUnit: "minutes", randomMin: 60, randomMax: 120, running: false, recentKeys: [], activity: [], baselineReady: false, lastState: "idle", manualSearchRunning: false, manualSearchState: "idle", lastManualAt: 0, lastManualResults: [], lastAutoAt: 0, lastAutoResults: [], darkMode: false, desktopNotificationEnabled: true, soundNotificationEnabled: true, selectedSound: "default" };

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const saved = await chrome.storage.local.get(null);
    const missing = Object.fromEntries(Object.entries(defaults).filter(([key]) => !(key in saved)));
    if (Object.keys(missing).length) await chrome.storage.local.set(missing);
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    await chrome.storage.local.set({ lastError: `擴充功能初始化失敗：${error?.message || error}` });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  const saved = await chrome.storage.local.get(defaults);
  await chrome.storage.local.set({ manualSearchRunning: false });
  if (saved.running) await schedule(saved);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) scanSearchTabs();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "POGO_SCOUT_START") {
    respond(start(message), sendResponse);
    return true;
  }
  if (message?.type === "POGO_SCOUT_UPDATE_INTERVAL") {
    respond(updateInterval(message), sendResponse);
    return true;
  }
  if (message?.type === "POGO_SCOUT_MANUAL_SEARCH") {
    respond(manualSearch(), sendResponse);
    return true;
  }
  if (message?.type === "POGO_SCOUT_CLEAR_RESULTS") {
    respond(clearResults(), sendResponse);
    return true;
  }
  if (message?.type === "POGO_SCOUT_STOP") {
    respond(stop(), sendResponse);
    return true;
  }
  if (message?.type === "POGO_SCOUT_STATE") {
    respond(chrome.storage.local.get(defaults).then((state) => ({ ...state, tabId: sender.tab?.id })), sendResponse);
    return true;
  }
  if (message?.type === "POGO_SCOUT_SCAN_RESULT") {
    respond(handleScanResult(message.result, sender.tab), sendResponse);
    return true;
  }
  if (message?.type === "POGO_SCOUT_STATUS") {
    respond(chrome.storage.local.set({ lastState: message.state, lastError: message.error || "", lastCheckedAt: Date.now() }).then(() => ({ ok: true })), sendResponse);
    return true;
  }
});

function respond(promise, sendResponse) {
  Promise.resolve(promise).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error?.message || "擴充功能發生錯誤。" }));
}

function nextDelaySeconds(config) {
  if (config.intervalMode === "random") {
    const min = Math.max(1, Math.floor(Number(config.randomMin) || 1));
    const max = Math.max(min, Math.floor(Number(config.randomMax) || min));
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  if (config.intervalMode === "custom") {
    const value = Math.max(1, Math.floor(Number(config.customValue) || 1));
    return value * (config.customUnit === "minutes" ? 60 : 1);
  }
  return Math.max(1, Number(config.interval) || 3) * 60;
}

async function start(config) {
  const tabs = await chrome.tabs.query({ url: ["https://pogocoordinates.com/search*"] });
  if (!tabs.length) {
    await chrome.tabs.create({ url: SEARCH_URL, active: false });
    await chrome.storage.local.set({ running: false, lastState: "open_search" });
    return { ok: false, state: "open_search" };
  }
  await chrome.storage.local.set({ ...config, running: true, lastState: "starting", lastError: "" });
  await schedule(config);
  await scanSearchTabs();
  return { ok: true, state: "running" };
}

async function schedule(config) {
  await chrome.alarms.clear(ALARM_NAME);
  const delaySeconds = Math.max(1, nextDelaySeconds(config));
  await chrome.alarms.create(ALARM_NAME, { when: Date.now() + delaySeconds * 1000 });
}

async function stop() {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.storage.local.set({ running: false, lastState: "idle" });
  return { ok: true, state: "idle" };
}

async function updateInterval(config) {
  await chrome.storage.local.set(config);
  const { running } = await chrome.storage.local.get("running");
  if (running) await schedule(config);
  return { ok: true };
}

async function scanSearchTabs() {
  const config = await chrome.storage.local.get(defaults);
  if (!config.running) return;
  const tabs = await chrome.tabs.query({ url: ["https://pogocoordinates.com/search*"] });
  if (!tabs.length) {
    await chrome.storage.local.set({ lastState: "open_search", lastError: "請開啟 PoGo Coordinates 搜尋頁。" });
    return;
  }
  const tab = tabs.find((candidate) => candidate.active) || tabs[0];
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: "POGO_SCOUT_SCAN" });
    if (result?.state) await chrome.storage.local.set({ lastState: result.state, lastError: result.error || "", lastCheckedAt: Date.now() });
    await schedule(config);
  } catch {
    await chrome.storage.local.set({ lastState: "page_unavailable", lastError: "搜尋頁尚未準備好，稍後會再試。" });
    await schedule(config);
  }
}

async function manualSearch() {
  const { manualSearchRunning } = await chrome.storage.local.get("manualSearchRunning");
  if (manualSearchRunning) return { ok: false, error: "手動搜尋正在進行中，請稍候。" };
  const tabs = await chrome.tabs.query({ url: ["https://pogocoordinates.com/search*"] });
  if (!tabs.length) return { ok: false, error: "請先開啟並登入 PoGo Coordinates 搜尋頁。" };
  await chrome.storage.local.set({ manualSearchRunning: true, manualSearchState: "searching", manualSearchError: "" });
  try {
    const tab = tabs.find((candidate) => candidate.active) || tabs[0];
    const result = await chrome.tabs.sendMessage(tab.id, { type: "POGO_SCOUT_MANUAL_SEARCH" });
    if (result?.state !== "running") throw new Error(result?.error || "網站沒有回傳可辨識的搜尋結果。");
    await handleManualScanResult(result, tab);
    return { ok: true, resultCount: result.spawns?.length || 0 };
  } catch (error) {
    await chrome.storage.local.set({ manualSearchState: "error", manualSearchError: error?.message || "手動搜尋失敗。" });
    return { ok: false, error: error?.message || "搜尋頁尚未準備好，請重新載入搜尋頁後重試。" };
  } finally {
    await chrome.storage.local.set({ manualSearchRunning: false });
  }
}

async function handleScanResult(result, tab) {
  const saved = await recordScanResults(result);
  const foundAt = Date.now();
  await chrome.storage.local.set({
    lastState: "running", lastError: "", lastCheckedAt: foundAt,
    lastAutoAt: foundAt, lastAutoResults: (result.spawns || []).slice(0, 10).map((spawn) => ({ ...spawn, foundAt }))
  });
  return { ok: true, newCount: saved.fresh.length, tabId: tab?.id };
}

async function handleManualScanResult(result, tab) {
  const saved = await recordScanResults(result);
  const foundAt = Date.now();
  await chrome.storage.local.set({
    manualSearchState: "done",
    manualSearchError: "",
    lastManualAt: foundAt,
    lastManualResults: (result.spawns || []).slice(0, 10).map((spawn) => ({ ...spawn, foundAt }))
  });
  return { ok: true, resultCount: result.spawns?.length || 0, newCount: saved.fresh.length, tabId: tab?.id };
}

async function clearResults() {
  await chrome.storage.local.set({
    recentKeys: [], activity: [], baselineReady: false, currentPageTargets: [],
    lastManualAt: 0, lastManualResults: [], lastAutoAt: 0, lastAutoResults: [], manualSearchState: "idle", manualSearchError: ""
  });
  return { ok: true };
}

async function recordScanResults(result) {
  if (!result) return { ok: false };
  const { recentKeys = [], activity = [], baselineReady = false } = await chrome.storage.local.get(defaults);
  const currentResults = result.spawns || [];
  const fresh = baselineReady ? currentResults.filter((spawn) => !recentKeys.includes(spawn.key)) : [];
  const keysToRemember = baselineReady ? fresh : currentResults;
  const nextKeys = [...recentKeys, ...keysToRemember.map((spawn) => spawn.key)].slice(-300);
  const nextActivity = [...fresh.map((spawn) => ({ ...spawn, foundAt: Date.now() })), ...activity].slice(0, 30);
  await chrome.storage.local.set({
    recentKeys: nextKeys,
    activity: nextActivity,
    baselineReady: true,
    currentPageTargets: result.targets || []
  });
  const preferences = await chrome.storage.local.get(defaults);
  const sound = ["default", "soft", "chime", "mute"].includes(preferences.selectedSound) ? preferences.selectedSound : "default";
  if (fresh.length && preferences.soundNotificationEnabled && sound !== "mute") await playNotificationSound(sound);
  if (!preferences.desktopNotificationEnabled) return { ok: true, fresh };

  for (const spawn of fresh) {
    try {
      await chrome.notifications.create(`spawn-${Date.now()}-${Math.random()}`, {
        type: "basic",
        iconUrl: spawn.iconDataUrl?.startsWith("data:image/") ? spawn.iconDataUrl : "notification.png",
        title: `發現 ${spawn.name}`,
        message: `${spawn.location || "搜尋結果"} · CP ${spawn.cp || "—"}`,
        contextMessage: "PoGo Coordinates 新搜尋結果",
        silent: true
      });
    } catch (error) {
      await chrome.storage.local.set({ lastError: `桌面通知無法顯示：${error?.message || error}` });
    }
  }
  return { ok: true, fresh };
}

async function playNotificationSound(sound) {
  try {
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({ type: "POGO_SCOUT_PLAY_SOUND", sound });
  } catch (error) {
    console.warn("Pogo Scout could not play the selected notification sound.", error);
  }
}

let creatingOffscreenDocument;
async function ensureOffscreenDocument() {
  if (!chrome.offscreen) throw new Error("此瀏覽器不支援擴充功能背景音效。");

  if (typeof chrome.offscreen.hasDocument === "function" && await chrome.offscreen.hasDocument()) return;
  if (typeof chrome.runtime.getContexts === "function") {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [chrome.runtime.getURL("offscreen.html")]
    });
    if (contexts.length) return;
  }

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "播放使用者選擇的新搜尋結果提示音。"
    }).catch(async (error) => {
      const alreadyOpen = typeof chrome.offscreen.hasDocument === "function" && await chrome.offscreen.hasDocument();
      if (!alreadyOpen && !/single offscreen document/i.test(error?.message || "")) throw error;
    }).finally(() => { creatingOffscreenDocument = null; });
  }
  await creatingOffscreenDocument;
}

