# GWB Tools (browser extension)

GWB Tools is the browser edition of the free tools on [greaterworldmedia.tech](https://greaterworldmedia.tech/). It is built for OZOR INC LLC under the brand GWB: Greater World Business. It is not published from this repository, and it is not part of the public website. The GitHub Pages workflow deletes the `extension/` folder before it uploads the site.

## Stack

[WXT](https://wxt.dev/) 0.21, TypeScript, Vite, and Preact.

- One Manifest V3 project produces the Chrome, Edge, Firefox, and Safari builds. WXT sets the Firefox add-on id and the sidebar, and the Chrome/Edge side panel, without a second codebase.
- Vite bundles the popup. The website tools are copied in at build time and run as extension sandbox pages, so their existing scripts keep working offline. The live site files are not edited.
- Preact draws the popup. The official WXT Preact module is not published, and Preact is small enough to wire up directly.
- Vitest covers the tier rules, favorites, search, tips, and both AI adapters. Playwright loads the unpacked extension in Chromium.

## What each tier includes

Prices live in `src/config.ts`. The unpublished suggestions are **Pro $4.99 once** and **Pro Plus $6.99 per month**.

| | Free | Pro (one-time) | Pro Plus (monthly) |
| --- | --- | --- | --- |
| All tools, favorites, search | yes | yes | yes |
| Page tools (PDF, Markdown, notes, QR, tables, contacts, screenshots, invoice prefill, right-click) | locked, with an upgrade note in the panel | yes, on this device | yes |
| On-device AI (summary, rewrite, translate, explain, title, invoice line) | locked | yes, when this browser has Chrome’s built-in model | yes |
| Cloud AI (chat, structured Excel, email, quote, multi-document summary, form fill) | locked | locked | yes, subscription |
| Page tips | a one-line teaser | a small hint you can dismiss or turn off | the same hint |

On-device AI uses Chrome’s built-in APIs when they exist: Summarizer, Prompt API (`LanguageModel`), Writer, Rewriter, Translator, and Language Detector, including the older `window.ai` names. Those are backed by Gemini Nano and cost nothing per use. The extension checks for each API and, if this browser does not have it, shows a plain message. Basic AI never falls back to a paid cloud model.

Pro Plus calls `backendUrl` in the config. That value is a placeholder until you run your own proxy. The extension has no model API key. See `backend/README.md`. Each install is limited to `plusMonthlyRequestLimit` successful requests per UTC month (200). The counter is stored on the device, and the proxy is expected to enforce the same limit.

Page tips run only after you open the extension or click “Check this page.” They look at signals already on that tab (a table, a PDF link, a long article, invoice-like wording, several images). Nothing about the visit is stored or uploaded. Dismiss hides that tip. “Show page tips” turns them off.

## Permissions

The review build asks for:

- `storage` — favorites (synced by the browser when the user is signed in), tips preference, test-mode tier, monthly counter, anonymous install id
- `activeTab` — the tab the user opened the extension from
- `scripting` — inject the page reader after a click
- `contextMenus` — the right-click menu
- `sidePanel` — Chrome and Edge only

It does **not** ask for access to every website. A live ExtensionPay id adds `https://extensionpay.com/*`. A real `backendUrl` adds that server’s origin only. Both stay off while the config still says `REPLACE`.

## Paywall

`paywallMode` is `dev` and `extensionPayId` is `REPLACE_WITH_EXTENSIONPAY_ID`. In that state the Plans screen has a Free / Pro / Pro Plus switch and the Unlock buttons change the tier on this device. No charge is made.

When you set `paywallMode` to `live` and paste a real ExtensionPay id:

- Chrome, Firefox, and Edge (with `edgeBilling: 'extensionpay'`) use ExtensionPay. Create two plans whose nicknames are `pro` (one-time) and `plus` (monthly).
- Safari uses the App Store adapter. Product ids: `tech.greaterworldmedia.gwbtools.pro` and `tech.greaterworldmedia.gwbtools.plus.monthly`. The purchase calls have to be finished in the Xcode project; this repo only names them.
- Edge can later use `edgeBilling: 'microsoft-store'` with add-on ids `gwb.pro.lifetime` and `gwb.plus.monthly`. That adapter is the same kind of stub: the UI calls it, the store purchase is wired when you submit to Microsoft.

ExtensionPay’s `getUser()` result is read as: a paid one-time `pro` plan (or a paid user with no plan nickname) is Pro; an active or trialing `plus` plan is Pro Plus; a canceled `plus` plan is Free. Pro Plus includes the Pro features while the subscription is active. If a customer buys lifetime Pro and later subscribes to Plus, confirm in the ExtensionPay dashboard that canceling Plus still reports the one-time plan. A canceled Plus plan on its own does not leave Pro turned on.

## Build on Windows

Install Node.js 22 (or 20) and Python 3. In this folder:

```bash
npm install
npm run build
```

That draws the icons, copies the website tools, and writes:

- `.output/chrome-mv3/` — unpacked extension for Chrome and Edge
- `.output/gwb-tools-1.0.0-chrome.zip` — upload this to Chrome and to Edge
- `.output/firefox-mv3/` and `.output/gwb-tools-1.0.0-firefox.zip` (needs Firefox 140 or newer)

Load unpacked, for a trial on your PC: Chrome or Edge → Extensions → Developer mode → Load unpacked → select `.output/chrome-mv3`. Firefox → `about:debugging` → Load Temporary Add-on → the manifest inside `.output/firefox-mv3`.

Firefox does not support the sandbox pages Chrome uses for the copied tools. Favorites, search, page tools, tips, and AI run in Firefox. The invoice, PDF, and image tools themselves keep the website’s inline scripts, so on Firefox use **Website version** for those pages (they are the same tools on greaterworldmedia.tech). Chrome, Edge, and the Safari build run those tools inside the extension, offline.

`npm test` runs the unit tests and the Chromium test. The browser test needs the Chrome build first (`npm run build:chrome` is part of `npm run build`).

## Safari (needs a Mac)

This project cannot produce a signed Xcode app. WXT’s Safari target, when it is available, only emits an unpacked extension. On a Mac with Xcode:

```bash
npm run build:safari
xcrun safari-web-extension-converter .output/safari-mv3 \
  --project-location ./safari-xcode \
  --app-name "GWB Tools" \
  --bundle-identifier tech.greaterworldmedia.gwbtools \
  --swift --copy-resources --no-open
```

`npm run build:safari` writes `.output/safari-mv3` (Manifest V3). The Safari manifest leaves out `sidePanel`, which Safari does not implement; “Larger view” opens a normal tab there. Open the Xcode project the converter creates, set the team to the Apple Developer account for OZOR INC LLC, add the two in-app purchases named above, and archive for App Store Connect. iOS uses that same Mac project. There is no Windows path for the Safari build.

On Firefox, the listing says the extension collects no data by default. The first time someone uses a Pro Plus action, Firefox asks whether that chosen page text may be sent. Until they allow it, nothing is sent. Chrome, Edge, and Safari do not have that extra prompt; the in-panel description is the disclosure there.

## What you do to publish

Do these yourself. This repository does not create the accounts.

1. **Chrome Web Store.** Register a developer account (a one-time fee, $5 at the time of writing). Upload the Chrome zip, the listing in `store/LISTING.md`, the privacy draft in `store/PRIVACY.md`, and the 1280×800 screenshots.
2. **Edge Add-ons.** Use the Microsoft Partner Center account. Listing is generally free. You can upload the same Chrome zip. Confirm the current Partner Center rules.
3. **Firefox.** Create an add-on at addons.mozilla.org (free). Upload the Firefox zip. The id is `gwb-tools@greaterworldmedia.tech`.
4. **Safari.** Apple Developer Program (about $99 a year) and a Mac, as above.
5. **ExtensionPay.** Sign up at extensionpay.com, create the extension, and create the `pro` and `plus` plans at the prices in `src/config.ts`. Their fee is on top of Stripe; check the current rate on their site. Paste the extension id into `extensionPayId`, set `paywallMode` to `live`, and rebuild. The test-mode switch disappears.
6. **Pro Plus server.** Follow `backend/README.md`. Put the model key only on that server. Set `backendUrl`, rebuild, and the extension will be allowed to contact that origin and nowhere else.

Fees and store rules change. Confirm them on the store sites before you pay.

## Privacy

The draft is `store/PRIVACY.md`. Free and Pro do not upload page contents. Pro Plus sends only the content the user chose for that click, and an anonymous install id for the monthly limit. It does not send browsing history.

## Tests

```bash
npm run test:unit
npm run test:e2e
```

The browser test loads the unpacked extension in Playwright’s Chromium (not the branded Google Chrome, which refuses the load-extension flag). It favorites a tool, searches, exports an invoice, builds a QR code, compresses an image, checks axe on the popup and those tool pages, and walks Free → Pro → Pro Plus on the sample pages.
