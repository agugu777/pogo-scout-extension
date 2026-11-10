let scanPromise = null;
const iconCache = new Map();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "POGO_SCOUT_READ_STATE") {
    Promise.all([waitForSearchButton(10000), readResults(false)]).then(([button, result]) => {
      const loggedOut = detectLogin().loggedOut;
      sendResponse({
        state: loggedOut ? "login_required" : button ? "ready" : "search_unavailable",
        error: loggedOut ? "請先登入 PoGo Coordinates。" : button ? "" : "搜尋頁尚未完成載入，請稍候。",
        targets: result.targets
      });
    });
    return true;
  }
  if (message?.type === "POGO_SCOUT_SCAN") {
    automaticSearch().then(sendResponse);
    return true;
  }
  if (message?.type === "POGO_SCOUT_MANUAL_SEARCH") {
    searchPage(true).then(sendResponse);
    return true;
  }
});

// The site renders its search UI asynchronously. Probe once after the content
// script starts so the side panel can connect without a manual refresh/search.
setTimeout(() => reportPageState(), 0);

function searchPage(includeIcons = true) {
  if (scanPromise) return scanPromise;
  scanPromise = performSearch(includeIcons).finally(() => { scanPromise = null; });
  return scanPromise;
}

async function automaticSearch() {
  const result = await searchPage();
  if (result.state === "running") {
    try { await chrome.runtime.sendMessage({ type: "POGO_SCOUT_SCAN_RESULT", result }); }
    catch { return { state: "error", error: "搜尋完成，但擴充功能背景服務無法接收結果。" }; }
  } else reportStatus(result);
  return result;
}

async function performSearch(includeIcons) {
  try {
    const before = await readResults(false);
    const login = detectLogin();
    if (login.loggedOut) {
      const state = { state: "login_required", error: "請先在 PoGo Coordinates 登入；本工具不會讀取或保存帳密。" };
      reportStatus(state);
      return state;
    }
    const searchButton = await waitForSearchButton();
    if (!searchButton || searchButton.disabled) {
      const state = { state: "search_unavailable", error: "找不到可用的 Search 按鈕，請確認目前在搜尋頁。" };
      reportStatus(state);
      return state;
    }
    await waitForSearchToFinish(searchButton);
    const results = await readResults(includeIcons);
    const spawns = results.cards.filter((card) => card.key && card.name);
    const data = { state: "running", spawns, targets: results.targets, loggedIn: !login.loggedOut, resultCount: spawns.length, changed: results.signature !== before.signature };
    return data;
  } catch (error) {
    const state = { state: "error", error: error?.message || "搜尋頁讀取失敗。" };
    reportStatus(state);
    return state;
  }
}

function reportStatus(status) {
  chrome.runtime.sendMessage({ type: "POGO_SCOUT_STATUS", ...status }).catch(() => {});
}

function detectLogin() {
  const text = document.body?.innerText || "";
  const explicitLoginPrompt = /\b(log\s*in|sign\s*in)\b/i.test(text) &&
    (document.querySelector('input[type="password"], form[action*="login" i], form[action*="sign-in" i]') !== null);
  return { loggedOut: explicitLoginPrompt };
}

async function waitForSearchButton(timeoutMs = 10000) {
  const immediate = findSearchButton();
  if (immediate) return immediate;
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const button = findSearchButton();
      if (button) finish(button);
    });
    const timer = setTimeout(() => finish(findSearchButton()), timeoutMs);
    function finish(button) {
      observer.disconnect();
      clearTimeout(timer);
      resolve(button);
    }
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  });
}

async function reportPageState() {
  try {
    await waitForSearchButton(10000);
    const login = detectLogin();
    reportStatus(login.loggedOut
      ? { state: "login_required", error: "請先在 PoGo Coordinates 登入；本工具不會讀取或保存帳密。" }
      : { state: findSearchButton() ? "ready" : "search_unavailable", error: findSearchButton() ? "" : "搜尋頁尚未完成載入，請稍候。" });
  } catch { /* A page navigation can destroy the document during the probe. */ }
}

function findSearchButton() {
  return [...document.querySelectorAll("button")].find((button) => button.innerText.trim().toLowerCase() === "search");
}

async function readResults(includeIcons) {
  const buttons = [...document.querySelectorAll("button")].filter((button) => /get\s+coords/i.test(button.innerText.trim()));
  const cards = (await Promise.all(buttons.map((button) => readCard(button, includeIcons)))).filter(Boolean);
  const targets = [...new Set(cards.map((card) => card.name))];
  const signature = cards.map((card) => card.key).join("|");
  return { cards, targets, signature };
}

async function readCard(button, includeIcon) {
  let node = button;
  let cardNode = null;
  let chosen = "";
  for (let depth = 0; depth < 7 && node; depth += 1, node = node.parentElement) {
    const text = (node.innerText || "").replace(/\s+/g, " ").trim();
    if (/\bLOCATION\b/i.test(text) && /\bCP\s*\d+/i.test(text) && /\bIV\s*\d+%/i.test(text)) {
      chosen = text;
      cardNode = node;
      break;
    }
  }
  if (!chosen) return null;
  const nameMatch = chosen.match(/(.+?)\s+#\s*\d{1,4}\b/);
  const cpMatch = chosen.match(/\bCP\s*(\d+)/i);
  const ivMatch = chosen.match(/\bIV\s*(\d+%?)/i);
  const locationMatch = chosen.match(/\bLOCATION\s+(.+?)(?=\s+DESPAWN\b|$)/i);
  const name = nameMatch?.[1]?.replace(/^Showing\s+\d+\s+spawns.*?\bcap\s+\d+\s*/i, "").trim();
  const location = locationMatch?.[1]?.trim() || "";
  const cp = cpMatch?.[1] || "";
  const iv = ivMatch?.[1] || "";
  if (!name) return null;
  const key = [name, location, cp, iv].join("::").toLowerCase();
  const card = { key, name, location, cp, iv, text: chosen };
  if (includeIcon) {
    const icon = await readPokemonIcon(cardNode, name);
    if (icon.startsWith("data:image/")) card.iconDataUrl = icon;
    else if (icon) card.iconUrl = icon;
  }
  return card;
}

async function readPokemonIcon(cardNode, name) {
  const images = [...cardNode.querySelectorAll("img")].filter((image) => image.currentSrc && image.naturalWidth > 0 && !image.closest("button"));
  if (!images.length) return "";
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  images.sort((a, b) => {
    const aMatch = (a.alt || "").toLowerCase().replace(/[^a-z0-9]+/g, "").includes(normalizedName) ? 1 : 0;
    const bMatch = (b.alt || "").toLowerCase().replace(/[^a-z0-9]+/g, "").includes(normalizedName) ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight);
  });
  const source = images[0].currentSrc;
  return (await imageToDataUrl(source)) || source;
}

function imageToDataUrl(source) {
  if (iconCache.has(source)) return iconCache.get(source);
  if (source.startsWith("data:image/")) return Promise.resolve(source);
  const task = new Promise((resolve) => {
    const image = new Image();
    const timer = setTimeout(() => resolve(""), 2500);
    image.crossOrigin = "anonymous";
    image.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 96; canvas.height = 96;
        const scale = Math.min(96 / image.naturalWidth, 96 / image.naturalHeight);
        const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
        canvas.getContext("2d").drawImage(image, (96 - width) / 2, (96 - height) / 2, width, height);
        resolve(canvas.toDataURL("image/png"));
      } catch { resolve(""); }
    };
    image.onerror = () => { clearTimeout(timer); resolve(""); };
    image.src = source;
  });
  iconCache.set(source, task);
  if (iconCache.size > 50) iconCache.delete(iconCache.keys().next().value);
  return task;
}

function resultButtonText() {
  return [...document.querySelectorAll("button")]
    .filter((candidate) => /get\s+coords/i.test(candidate.innerText.trim()))
    .map((candidate) => candidate.innerText.trim()).join("|");
}

function waitForSearchToFinish(button) {
  return new Promise((resolve) => {
    let quietTimer;
    let timeout;
    let sawDisabled = button.disabled;
    let sawResultChange = false;
    const initialText = button.innerText.trim();
    const beforeResultText = resultButtonText();
    const finish = () => {
      observer.disconnect();
      clearTimeout(quietTimer);
      clearTimeout(timeout);
      resolve();
    };
    const observer = new MutationObserver(() => {
      const currentButton = findSearchButton();
      if (currentButton?.disabled || currentButton?.innerText.trim() !== initialText) sawDisabled = true;
      if (resultButtonText() !== beforeResultText) sawResultChange = true;
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => {
        const latestButton = findSearchButton();
        const buttonReady = latestButton && !latestButton.disabled && latestButton.innerText.trim() === initialText;
        if ((sawDisabled && buttonReady) || (sawResultChange && buttonReady)) finish();
      }, 400);
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    timeout = setTimeout(finish, 3000);
    button.click();
    if (button.disabled) sawDisabled = true;
  });
}
