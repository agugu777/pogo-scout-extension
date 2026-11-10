const $ = (selector) => document.querySelector(selector);

async function state() {
  return chrome.storage.local.get({ interval: 3, intervalMode: "preset", customValue: 1, customUnit: "minutes", randomMin: 60, randomMax: 120, running: false, activity: [], lastState: "idle", lastCheckedAt: 0, lastError: "", manualSearchRunning: false, manualSearchState: "idle", lastManualAt: 0, lastManualResults: [], lastAutoAt: 0, lastAutoResults: [], darkMode: false, desktopNotificationEnabled: true, soundNotificationEnabled: true, selectedSound: "default" });
}
function intervalConfig() {
  const mode = $("#interval-mode").value;
  if (mode === "custom") return { intervalMode: mode, customValue: Number($("#custom-value").value), customUnit: $("#custom-unit").value };
  if (mode === "random") return { intervalMode: mode, randomMin: Number($("#random-min").value), randomMax: Number($("#random-max").value) };
  return { intervalMode: "preset", interval: Number($("#interval").value) || 3 };
}
function showIntervalFields() {
  const mode = $("#interval-mode").value;
  $("#preset-fields").hidden = mode !== "preset";
  $("#custom-fields").hidden = mode !== "custom";
  $("#random-fields").hidden = mode !== "random";
}
async function searchTab() {
  const tabs = await chrome.tabs.query({ url: ["https://pogocoordinates.com/search*"] });
  return tabs[0];
}
async function render() {
  const saved = await state();
  $("#running").checked = Boolean(saved.running);
  $("#interval-mode").value = saved.intervalMode || "preset";
  $("#interval").value = String(Math.min(5, Math.max(1, Number(saved.interval) || 3)));
  $("#custom-value").value = String(saved.customValue || 1);
  $("#custom-unit").value = saved.customUnit || "minutes";
  $("#random-min").value = String(saved.randomMin ?? 60);
  $("#random-max").value = String(saved.randomMax ?? 120);
  showIntervalFields();
  document.body.classList.toggle("dark", Boolean(saved.darkMode));
  $("#dark-mode").checked = Boolean(saved.darkMode);
  $("#desktop-notifications").checked = Boolean(saved.desktopNotificationEnabled);
  $("#sound-notifications").checked = Boolean(saved.soundNotificationEnabled);
  $("#selected-sound").value = saved.selectedSound || "default";
  $("#monitor-state").textContent = statusLabel(saved);
  $("#last-checked").textContent = saved.lastCheckedAt
    ? `上次搜尋 ${new Date(saved.lastCheckedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "尚未搜尋";

  const activity = saved.activity || [];
  const manualResults = saved.lastManualResults || [];
  const autoResults = saved.lastAutoResults || [];
  const combined = [...manualResults, ...autoResults, ...activity].filter((item, index, all) => all.findIndex((candidate) => candidate.key === item.key) === index);
  const list = $("#activity-list");
  list.replaceChildren();
  $("#activity-count").textContent = String(combined.length);
  if (!combined.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "尚無新結果";
    list.append(empty);
  }
  combined.slice(0, 30).forEach((item) => {
    const row = document.createElement("div"); row.className = "activity-item";
    if (item.iconDataUrl || item.iconUrl) {
      const sprite = document.createElement("img");
      sprite.className = "activity-sprite";
      sprite.src = item.iconDataUrl || item.iconUrl;
      sprite.alt = item.name;
      row.append(sprite);
    } else {
      const sprite = document.createElement("span");
      sprite.className = "activity-sprite fallback";
      sprite.textContent = "✦";
      row.append(sprite);
    }
    const copy = document.createElement("div"); copy.className = "activity-copy";
    const name = document.createElement("strong"); name.textContent = item.name;
    const detail = document.createElement("small"); detail.textContent = `${item.location || "搜尋結果"} · CP ${item.cp || "—"} · IV ${item.iv || "—"}`;
    copy.append(name, detail);
    const time = document.createElement("time"); time.textContent = new Date(item.foundAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    row.append(copy, time); list.append(row);
  });

  const manualButton = $("#manual-search");
  manualButton.disabled = Boolean(saved.manualSearchRunning);
  manualButton.textContent = saved.manualSearchRunning ? "搜尋中…" : "手動搜尋";
  $("#manual-status").textContent = saved.manualSearchRunning
    ? "正在搜尋並讀取目前的篩選結果…"
    : saved.manualSearchState === "error" ? saved.manualSearchError || "手動搜尋失敗。"
      : saved.lastManualAt ? `上次手動搜尋 ${new Date(saved.lastManualAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "按一下 Search，結果會顯示在這裡。";

  const tab = await searchTab();
  const connected = Boolean(tab && ["running", "ready"].includes(saved.lastState));
  $("#connection-dot").classList.toggle("connected", connected);
  if (!tab) $("#connection-state").textContent = "搜尋頁尚未開啟。請先開啟並登入 PoGo Coordinates。";
  else if (saved.lastState === "login_required") $("#connection-state").textContent = saved.lastError || "請先登入 PoGo Coordinates。";
  else if (saved.lastError) $("#connection-state").textContent = saved.lastError;
  else if (connected) $("#connection-state").textContent = "已連線，可以開始自動搜尋。";
  else $("#connection-state").textContent = "搜尋頁已開啟；按「重新檢查」確認連線。";
}

function statusLabel(saved) {
  if (saved.lastState === "login_required") return "等待登入";
  if (saved.lastState === "open_search") return "請開啟搜尋頁";
  if (["page_unavailable", "search_unavailable", "error"].includes(saved.lastState)) return "搜尋遇到問題";
  if (saved.running && saved.lastState === "running") return "自動搜尋中";
  if (saved.running) return "正在連線…";
  return "已停止";
}

$("#open-search").addEventListener("click", async () => {
  const tab = await searchTab();
  if (tab) await chrome.tabs.update(tab.id, { active: true });
  else await chrome.tabs.create({ url: "https://pogocoordinates.com/search" });
  render();
});

$("#refresh-page").addEventListener("click", async () => {
  const tab = await searchTab();
  if (!tab) {
    await chrome.storage.local.set({ lastState: "open_search", lastError: "請先開啟 PoGo Coordinates 搜尋頁。" });
    render();
    return;
  }
  try {
    const reply = await chrome.tabs.sendMessage(tab.id, { type: "POGO_SCOUT_READ_STATE" });
    if (reply) await chrome.storage.local.set({ lastState: reply.state, lastError: reply.error || "" });
  } catch {
    await chrome.storage.local.set({ lastState: "page_unavailable", lastError: "請重新載入 PoGo 搜尋頁，再按重新檢查。" });
  }
  render();
});

$("#running").addEventListener("change", async (event) => {
  const result = await chrome.runtime.sendMessage({
    type: event.target.checked ? "POGO_SCOUT_START" : "POGO_SCOUT_STOP",
    ...intervalConfig()
  });
  if (!result?.ok && event.target.checked) {
    event.target.checked = false;
    if (result?.state === "open_search") toast("請開啟並登入搜尋頁後再開始");
    else toast("連線失敗；請重新載入搜尋頁後重試");
  }
  render();
});

async function saveInterval() {
  const config = intervalConfig();
  const min = config.intervalMode === "random" ? config.randomMin : config.customValue;
  const max = config.intervalMode === "random" ? config.randomMax : config.customValue;
  if (config.intervalMode !== "preset" && (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > (config.intervalMode === "random" ? 86400 : 1440))) {
    toast(config.intervalMode === "random" ? "請輸入有效秒數範圍（最大 86400 秒）" : "請輸入 1 到 1440 的間隔");
    render(); return false;
  }
  await chrome.storage.local.set(config);
  const saved = await state();
  if (saved.running) await chrome.runtime.sendMessage({ type: "POGO_SCOUT_UPDATE_INTERVAL", ...config });
  render();
  return true;
}
$("#interval-mode").addEventListener("change", () => { showIntervalFields(); saveInterval(); });
["#interval", "#custom-value", "#custom-unit", "#random-min", "#random-max"].forEach((selector) => {
  $(selector).addEventListener("change", saveInterval);
});

$("#manual-search").addEventListener("click", async (event) => {
  try {
    const result = await chrome.runtime.sendMessage({ type: "POGO_SCOUT_MANUAL_SEARCH" });
    if (!result?.ok) toast(result?.error || "手動搜尋失敗，請確認搜尋頁連線");
  } catch { toast("手動搜尋失敗，請確認搜尋頁已載入"); }
});

$("#settings-toggle").addEventListener("click", () => {
  const settings = $("#settings");
  settings.hidden = !settings.hidden;
  $("#settings-toggle").setAttribute("aria-expanded", String(!settings.hidden));
});
document.addEventListener("click", (event) => {
  if (!$("#settings").hidden && !event.target.closest("#settings, #settings-toggle")) {
    $("#settings").hidden = true;
    $("#settings-toggle").setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("#settings").hidden = true;
    $("#settings-toggle").setAttribute("aria-expanded", "false");
    $("#clear-dialog").hidden = true;
  }
});

$("#dark-mode").addEventListener("change", async (event) => {
  await chrome.storage.local.set({ darkMode: event.target.checked });
  document.body.classList.toggle("dark", event.target.checked);
});

$("#desktop-notifications").addEventListener("change", async (event) => {
  await chrome.storage.local.set({ desktopNotificationEnabled: event.target.checked });
});
$("#sound-notifications").addEventListener("change", async (event) => {
  await chrome.storage.local.set({ soundNotificationEnabled: event.target.checked });
});
$("#selected-sound").addEventListener("change", async (event) => {
  await chrome.storage.local.set({ selectedSound: event.target.value });
});

$("#clear-results").addEventListener("click", async () => {
  $("#clear-dialog").hidden = false;
});
$("#keep-results").addEventListener("click", () => { $("#clear-dialog").hidden = true; });
$("#confirm-clear").addEventListener("click", async () => {
  $("#clear-dialog").hidden = true;
  await chrome.runtime.sendMessage({ type: "POGO_SCOUT_CLEAR_RESULTS" });
  toast("已清空搜尋結果");
});

function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}

chrome.storage.onChanged.addListener(render);
render();
setInterval(render, 15000);
