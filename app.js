const $ = (selector) => document.querySelector(selector);
const storageKey = "pogo-scout-settings-v1";
const pokemonCatalog = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Pikachu", "Eevee", "Gengar", "Gengar (Fall 2023 Costume)", "Mewtwo", "Dratini", "Dragonite", "Snorlax", "Lucario", "Gible", "Garchomp", "Riolu", "Togepi", "Ditto", "Larvitar", "Bagon", "Beldum", "Deino", "Frigibax"];
let settings = { targets: ["Gengar (Fall 2023 Costume)"], shinyOnly: true, coords: "", radius: 5, interval: 2, notice: true };
let toastTimer;

function loadSettings() {
  try { const saved = JSON.parse(localStorage.getItem(storageKey)); if (saved) settings = { ...settings, ...saved }; } catch { /* retain defaults */ }
  render();
}
function persist() { localStorage.setItem(storageKey, JSON.stringify(settings)); renderSummary(); }
function render() {
  renderTargets();
  $("#shiny-only").checked = settings.shinyOnly;
  $("#shiny-caption").textContent = settings.shinyOnly ? "只通知 Shiny 寶可夢" : "一般與 Shiny 都通知";
  $("#coords").value = settings.coords;
  $("#radius").value = settings.radius;
  $("#interval").value = String(settings.interval);
  $("#nav-target-count").textContent = settings.targets.length;
  renderSummary();
}
function renderTargets() {
  const holder = $("#target-chips");
  holder.replaceChildren();
  if (!settings.targets.length) {
    const hint = document.createElement("span"); hint.className = "field-hint"; hint.textContent = "尚未加入目標寶可夢"; holder.append(hint); return;
  }
  settings.targets.forEach((name) => {
    const chip = document.createElement("span"); chip.className = "target-chip";
    const icon = document.createElement("span"); icon.className = "chip-mon"; icon.textContent = "✦";
    const label = document.createElement("span"); label.textContent = name;
    const remove = document.createElement("button"); remove.className = "remove-chip"; remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `移除 ${name}`);
    remove.addEventListener("click", () => { settings.targets = settings.targets.filter((item) => item !== name); persist(); });
    chip.append(icon, label, remove); holder.append(chip);
  });
}
function renderSummary() {
  $("#summary-targets").textContent = `${settings.targets.length} 種`;
  $("#summary-area").textContent = settings.coords.trim() ? `${settings.radius} km 半徑` : "尚未設定";
  $("#summary-interval").textContent = `每 ${settings.interval} 分鐘`;
  const permission = "Notification" in window ? Notification.permission : "unsupported";
  $("#permission-status").textContent = permission === "granted" ? "桌面通知已允許" : permission === "denied" ? "通知遭封鎖，請在瀏覽器設定中允許" : "測試通知或開始監控時再啟用";
}
function showToast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
function addTarget(name = $("#pokemon-input").value.trim()) {
  if (!name) { showToast("請先輸入寶可夢名稱"); return; }
  if (!settings.targets.includes(name)) settings.targets.push(name);
  settings.targets.sort((a, b) => a.localeCompare(b));
  $("#pokemon-input").value = ""; hideSuggestions(); persist(); showToast(`已加入 ${name}`);
}
function showSuggestions(query) {
  const box = $("#suggestions"); box.replaceChildren();
  const choices = pokemonCatalog.filter((name) => name.toLowerCase().includes(query.toLowerCase()) && !settings.targets.includes(name)).slice(0, 6);
  if (!query || !choices.length) { hideSuggestions(); return; }
  choices.forEach((name) => {
    const button = document.createElement("button"); button.className = "suggestion-item"; button.type = "button"; button.textContent = name;
    button.addEventListener("mousedown", (event) => event.preventDefault()); button.addEventListener("click", () => addTarget(name)); box.append(button);
  });
  box.classList.remove("hidden");
}
function hideSuggestions() { $("#suggestions").classList.add("hidden"); }

$("#add-target").addEventListener("click", () => addTarget());
$("#pokemon-input").addEventListener("input", (event) => showSuggestions(event.target.value.trim()));
$("#pokemon-input").addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); const first = $("#suggestions .suggestion-item"); addTarget(first?.textContent || undefined); } if (event.key === "Escape") hideSuggestions(); });
$("#pokemon-input").addEventListener("blur", () => setTimeout(hideSuggestions, 120));
$("#shiny-only").addEventListener("change", (event) => { settings.shinyOnly = event.target.checked; persist(); });
$("#coords").addEventListener("input", (event) => { settings.coords = event.target.value; persist(); });
$("#radius").addEventListener("input", (event) => { settings.radius = Math.max(1, Math.min(1000, Number(event.target.value) || 1)); persist(); });
$("#interval").addEventListener("change", (event) => { settings.interval = Number(event.target.value); persist(); });
$("#clear-targets").addEventListener("click", () => { settings.targets = []; persist(); showToast("已清除所有目標"); });
$("#clear-location").addEventListener("click", () => { settings.coords = ""; persist(); });
$("#notice-close").addEventListener("click", () => $("#source-notice").classList.add("hidden"));
$("#help-button").addEventListener("click", () => $("#help-dialog").showModal());
$("#close-help").addEventListener("click", () => $("#help-dialog").close());
$("#help-ok").addEventListener("click", () => $("#help-dialog").close());
$("#help-dialog").addEventListener("click", (event) => { if (event.target === $("#help-dialog")) $("#help-dialog").close(); });
$("#use-location").addEventListener("click", () => {
  if (!navigator.geolocation) { showToast("此瀏覽器不支援位置功能"); return; }
  navigator.geolocation.getCurrentPosition((position) => { settings.coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`; persist(); showToast("已填入目前位置"); }, () => showToast("無法取得位置，請確認瀏覽器的位置權限"));
});
$("#test-notification").addEventListener("click", async () => {
  if (!("Notification" in window)) { showToast("此瀏覽器不支援桌面通知"); return; }
  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  renderSummary();
  if (permission === "granted") { new Notification("Pogo Scout 通知測試", { body: "桌面通知已就緒。搜尋來源連線後，即可接收目標提醒。" }); showToast("測試通知已送出"); }
  else showToast("尚未允許通知，請在瀏覽器設定中啟用");
});
$("#start-monitor").addEventListener("click", () => showToast("搜尋來源連線後即可開始背景監控"));

loadSettings();
