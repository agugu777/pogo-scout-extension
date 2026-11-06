# Pogo Scout

Pogo Scout is a browser extension that checks the results shown on the [PoGo Coordinates search page](https://pogocoordinates.com/search) and notifies you when new results appear. Set up your search filters on PoGo Coordinates, then use Pogo Scout to run searches manually or at a chosen interval.

## What you need

- A desktop browser that supports Manifest V3 extensions, such as Google Chrome or Brave.
- A PoGo Coordinates account, signed in on the same browser profile.
- The PoGo Coordinates search page open in that browser.

Pogo Scout does not sign in for you or access the site's search API. It presses the visible **Search** button on the search page and reads the result cards displayed there. It does not read or store your password or cookies.

## Install Pogo Scout

1. Download the project from GitHub using **Code → Download ZIP**, then extract the downloaded archive.
2. Open the extensions page in your browser:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select the extracted `extension` folder.
5. Pin Pogo Scout from the browser's Extensions menu if you want quick access.

## Set up and search

1. Open [PoGo Coordinates](https://pogocoordinates.com/search) in the same browser profile and sign in.
2. Choose the Pokémon and other filters on the PoGo Coordinates page. Pogo Scout uses the filters currently selected on that page.
3. Keep the search page open and make sure its **Search** button is visible and available.
4. Open Pogo Scout from the browser toolbar. Check that the panel reports the search page is connected.
5. Choose how you want to search:
   - **Manual search:** Select **手動搜尋** to press the page's Search button once.
   - **Automatic search:** Turn on **自動搜尋** and choose a regular, custom, or random interval.

Manual search and automatic search are separate. A manual search runs once and does not change the automatic search schedule.

### Choose an automatic interval

- **Regular interval:** Choose one of the available preset intervals.
- **Custom interval:** Enter a number of seconds or minutes.
- **Random interval:** Enter a minimum and maximum number of seconds. For example, `60` to `120` chooses a random wait between 1 and 2 minutes for each search.

## Results and notifications

Manual and automatic searches appear together in the **Search results** list. Desktop notifications are sent for newly detected results. The first successful search establishes a baseline, so results already present at that point are not notified as new. Repeated results are deduplicated.

Open **Settings** to turn desktop notifications and sound cues on or off, and choose Default, Soft, Chime, or Mute. A selected sound plays once for each search that finds one or more new results. Desktop notifications stay silent so Windows does not play an additional sound for every result.

Use **Clear search results** in Settings to remove the result list and deduplication history. The next search creates a new baseline.

For desktop notifications, allow notifications for your browser in both the browser and your operating system settings.

## Important notes

- Keep the signed-in PoGo Coordinates search page open in the same browser profile. The extension needs the page's visible Search button and displayed results.
- Automatic searching only runs while the browser is open and the computer is awake. The extension cannot search after the browser is fully closed or while the computer is asleep.
- Search intervals, recent results, and deduplication history are stored locally in your browser. They are not synced to other devices.
- The extension depends on the site's page layout. If the Search button or result cards change, the extension may need an update.
- Follow PoGo Coordinates' [terms of use](https://pogocoordinates.com/terms). Stop searching if the site reports a rate limit or blocks the action.

## 繁體中文

Pogo Scout 是一款瀏覽器擴充功能，會讀取 [PoGo Coordinates 搜尋頁](https://pogocoordinates.com/search) 上顯示的結果，並在發現新結果時通知你。先在 PoGo Coordinates 設定搜尋條件，再使用 Pogo Scout 手動搜尋一次，或設定自動搜尋間隔。

### 使用前準備

- 使用支援 Manifest V3 擴充功能的桌面瀏覽器，例如 Google Chrome 或 Brave。
- 在同一個瀏覽器設定檔登入 PoGo Coordinates。
- 保持 PoGo Coordinates 搜尋頁開啟。

Pogo Scout 不會替你登入，也不會呼叫網站的搜尋 API。它會按下搜尋頁上可見的 **Search** 按鈕，並讀取頁面顯示的結果卡片；不會讀取或儲存你的密碼或 Cookie。

### 安裝 Pogo Scout

1. 在 GitHub 專案頁選擇 **Code → Download ZIP**，下載後解壓縮。
2. 在瀏覽器網址列開啟擴充功能管理頁：
   - Chrome：`chrome://extensions`
   - Brave：`brave://extensions`
3. 開啟右上方的「開發人員模式」。
4. 選擇「載入未封裝項目」，再選取解壓縮後的 `extension` 資料夾。
5. 如需快速開啟，可在瀏覽器的擴充功能選單中將 Pogo Scout 釘選到工具列。

### 設定並開始搜尋

1. 在同一個瀏覽器設定檔開啟 [PoGo Coordinates 搜尋頁](https://pogocoordinates.com/search) 並登入。
2. 在 PoGo Coordinates 網站設定寶可夢及其他篩選條件。Pogo Scout 會沿用該頁目前選取的條件。
3. 保持搜尋頁開啟，並確認頁面上可見且可使用 **Search** 按鈕。
4. 從瀏覽器工具列開啟 Pogo Scout，確認面板顯示搜尋頁已連線。
5. 選擇搜尋方式：
   - **手動搜尋：**按「手動搜尋」，立即按一次網站上的 Search。
   - **自動搜尋：**開啟「自動搜尋」，再選擇常規、自訂或隨機間隔。

手動搜尋與自動搜尋各自獨立。手動搜尋只執行一次，不會改變自動搜尋的排程。

#### 設定自動搜尋間隔

- **常規間隔：**從提供的固定間隔中選擇。
- **自訂間隔：**輸入秒數或分鐘數。
- **隨機間隔：**輸入最小與最大秒數。例如填入 `60` 到 `120`，每次會隨機等待 1 到 2 分鐘。

### 搜尋結果與通知

手動與自動搜尋的結果會合併顯示在「搜尋結果」清單。新發現的結果會送出桌面通知。第一次成功搜尋時會建立比對基準，因此當時已存在的結果不會被當成新結果通知；重複結果也會去重。

開啟「設定」可分別開關桌面通知和音效提示，並選擇「預設音效」、「柔和提示音」、「輕快叮咚聲」或「靜音」。每次搜尋只要找到一筆以上新結果，就會播放一次所選音效。桌面通知會以靜音方式顯示，避免 Windows 對每筆結果重複播放系統音效。

若要清除結果清單和去重紀錄，請在「設定」中選擇「清空搜尋結果」。下一次搜尋會重新建立比對基準。

如未收到桌面通知，請確認瀏覽器和作業系統都允許該瀏覽器顯示通知。

### 使用須知

- 請在同一個瀏覽器設定檔保持 PoGo Coordinates 搜尋頁開啟並登入。擴充功能需要使用頁面上可見的 Search 按鈕及搜尋結果。
- 瀏覽器完全關閉或電腦進入睡眠時，自動搜尋無法繼續執行。
- 搜尋間隔、最近結果與去重紀錄只儲存在目前瀏覽器，不會同步到其他裝置。
- 擴充功能依賴網站頁面結構；若 Search 按鈕或結果卡片改版，可能需要更新擴充功能。
- 請遵守 PoGo Coordinates 的[使用條款](https://pogocoordinates.com/terms)。若網站顯示速率限制或阻擋搜尋，請停止搜尋。
