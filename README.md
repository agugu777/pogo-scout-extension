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
