# Pogo Scout

Pogo Scout is a lightweight browser extension prototype for the free PoGo Coordinates search page. It does not call the site's search API: the content script clicks the visible Search button on an already signed-in search tab and reads the rendered result cards. It never reads, copies, or stores the site's login credentials or cookies.

## Project stages

1. **Interface prototype — complete.** A responsive dashboard prototype lives in the project root.
2. **Search-page connection — implemented as a browser-extension prototype.** It detects the signed-in search page, clicks its visible Search button, and reads displayed spawn cards. All filters are configured on PoGo Coordinates.
3. **Background monitoring and alerts — implemented, needs extension-level real-browser verification.** Automatic monitoring offers common 1–5 minute intervals, custom fixed seconds/minutes, and a random seconds range. Manual search is a separate action and displays the latest scan results independently of the automatic monitoring status. Both paths add newly seen results to local activity and send desktop notifications.
4. **Personal distribution — next.** Package and publish the extension (or privately distribute the zip) so each person installs it in their own browser and signs in to PoGo Coordinates there.
5. **Public website — optional companion.** A static hosted landing page can explain and distribute the extension. The extension, not the website, performs page monitoring. No application database or user login is needed for the requested browser-local storage model.

## Important scope and limits

- The site page supplies the actual Pokemon, location, Shiny, and other search filters. Every result returned by the current page filters can alert when it first appears after the initial baseline.
- Desktop notifications and recent activity use the Pokemon sprite shown on each result card when the browser can read that image; if the image host blocks image export, the desktop notification uses its built-in icon and the activity row uses a sparkle. Small thumbnails are stored locally with recent activity (up to 30 entries).
- Monitoring requires an open PoGo Coordinates search tab in the same browser profile, signed in. The extension does not log in for the user.
- Interval, deduplication keys, and recent activity use `chrome.storage.local`; they do not sync between a user's home and work computers. Each browser/device keeps its own data and needs its own extension install and site login.
- The default interval is 3 minutes, with 1–5 minute choices, custom fixed seconds/minutes, or a random interval between a minimum and maximum number of seconds. For example, 60–120 seconds gives a random interval between 1 and 2 minutes. Use an interval consistent with the site's current limits and stop monitoring if the site reports rate limiting or blocks automation. The site's terms prohibit bypassing rate limits/authentication/access controls and bulk redistribution: https://pogocoordinates.com/terms.
- A browser extension cannot keep scanning after the browser is fully closed or the computer is asleep. Desktop notification delivery also depends on browser and operating-system notification settings.
- The Chrome/Brave extension prototype has not yet been exercised in the user's live browser. Result-card markup can change, and should be verified before public distribution.

## Verification note — 2026-10-29

The signed-in PoGo Coordinates search page was visible in Chrome and showed the logged-in marker plus 10 rendered Gengar (Fall 2023 Costume) results. The extension was subsequently loaded, but its panel reported that the search page was unavailable; reload the search tab after loading the updated extension, then use “重新檢查.” Background scheduling and desktop notifications still need successful end-to-end verification.

## Load unpacked for development

1. Open `chrome://extensions` in Chrome or `brave://extensions` in Brave.
2. Turn on Developer mode and choose **Load unpacked**.
3. Select this project's `extension` folder.
4. Open `https://pogocoordinates.com/search` in that same browser profile and sign in normally.
5. Set the desired Pokemon and filters on the site, open the Pogo Scout side panel, confirm the connection, and enable monitoring.

The included `extension.zip` can be shared privately as source, but users still need to load/install it in their browser. A public URL alone cannot run this browser extension.

## 繁體中文

Pogo Scout 是一款輕量級瀏覽器擴充功能，供 PoGo Coordinates 搜尋頁使用。它不會呼叫網站的搜尋 API，而是在已登入的搜尋頁按下可見的 Search 按鈕，再讀取頁面上顯示的結果卡片。擴充功能不會讀取、複製或儲存網站的登入資料或 Cookie。

### 專案進度

1. **介面原型 — 已完成。** 專案根目錄包含響應式儀表板原型。
2. **連接搜尋頁 — 已以瀏覽器擴充功能原型實作。** 擴充功能會確認搜尋頁登入狀態、按下 Search，並讀取顯示的寶可夢結果。寶可夢、地點、Shiny 等篩選條件都在 PoGo Coordinates 網站設定。
3. **背景監控與通知 — 已實作，仍需在實際瀏覽器完成端對端驗證。** 自動搜尋支援常用的 1 至 5 分鐘間隔、自訂秒數或分鐘，以及隨機秒數範圍。手動搜尋會立即執行一次，不改變自動搜尋排程。手動與自動搜尋結果會顯示在同一份清單；新出現的結果會加入本機活動紀錄並送出桌面通知。
4. **個人使用與散佈 — 待處理。** 可打包擴充功能並私下分享，讓每位使用者在自己的瀏覽器安裝，並自行登入 PoGo Coordinates。
5. **公開網站 — 可選的配套項目。** 靜態網站可用來介紹或提供擴充功能下載；實際搜尋監控由擴充功能執行，不需要應用程式資料庫或額外的使用者帳號。

### 使用範圍與限制

- 搜尋條件由 PoGo Coordinates 頁面提供。完成初始比對基準後，符合目前頁面篩選條件且首次出現的結果會觸發通知；同一結果不會重複提醒。
- 搜尋結果清單會合併顯示手動與自動搜尋結果。若瀏覽器可以讀取結果卡片中的寶可夢圖片，清單和桌面通知會使用該圖示；若圖片來源不允許匯出，通知會改用擴充功能圖示，清單則可能顯示預設符號。最近活動與圖示資料最多在本機保留 30 筆。
- 監控時，必須在同一個瀏覽器設定檔開啟並登入 PoGo Coordinates 搜尋頁。擴充功能不會代替使用者登入。
- 搜尋間隔、去重紀錄與最近活動儲存在 `chrome.storage.local`，不會在不同電腦間同步。每台電腦都需要各自安裝擴充功能並登入網站。
- 預設間隔為 3 分鐘，也可選擇 1 至 5 分鐘、自訂固定秒數或分鐘，或指定最小與最大秒數進行隨機間隔。例如設定 60 至 120 秒，代表每次隨機等待 1 至 2 分鐘。請遵守網站目前的使用限制；若網站出現速率限制或阻擋自動操作，請停止監控。網站條款禁止規避速率限制、驗證或存取控制，以及大量再散佈：https://pogocoordinates.com/terms。
- 瀏覽器完全關閉或電腦進入睡眠時，擴充功能無法持續搜尋。桌面通知也取決於瀏覽器與作業系統的通知設定。
- Chrome／Brave 擴充功能原型尚未在使用者的實際瀏覽器完成端對端驗證。網站結果卡片的結構可能變更，公開散佈前應再次確認。

### 驗證紀錄 — 2026-10-29

當時 Chrome 中已登入的 PoGo Coordinates 搜尋頁顯示 10 筆 Gengar (Fall 2023 Costume) 結果。載入擴充功能後，側邊欄曾回報搜尋頁無法使用；載入更新版擴充功能後，請重新載入搜尋頁並按「重新檢查」。背景排程和桌面通知仍待端對端驗證。

### 開發時載入未封裝的擴充功能

1. 在 Chrome 或 Brave 開啟 `chrome://extensions` 或 `brave://extensions`。
2. 開啟「開發人員模式」，選擇 **載入未封裝項目**。
3. 選取本專案的 `extension` 資料夾。
4. 在同一個瀏覽器設定檔開啟 `https://pogocoordinates.com/search` 並正常登入。
5. 在網站設定寶可夢與篩選條件，開啟 Pogo Scout 側邊欄，確認連線後即可啟用自動搜尋；也可單獨使用手動搜尋。

專案附帶的 `extension.zip` 可私下分享原始檔，但使用者仍需在瀏覽器載入或安裝擴充功能。單純提供公開網址無法執行這個瀏覽器擴充功能。
