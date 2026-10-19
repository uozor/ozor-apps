# Store listing draft — GWB Tools

Publisher: OZOR INC LLC. Brand line: GWB: Greater World Business.

Use the same text on the Chrome Web Store, Microsoft Edge Add-ons, and Firefox Add-ons. Safari uses the same description inside App Store Connect. Do not submit until the steps in `extension/README.md` are done. This repository does not publish the listing.

## Name

GWB Tools

## Short description

Free small-business tools in your browser. Optional Pro reads only the page you choose. Nothing is uploaded for free tools.

(127 characters. Chrome’s limit is 132.)

## Long description

GWB Tools puts the free tools from Greater World Business inside the browser, so they work offline and without an account.

Star the tools you use. Search the full set: invoices, PDF merge, image compress, QR codes, sales tax, and the rest. Open any tool in the extension, or jump to the same tool on greaterworldmedia.tech. PDF, Excel, and CSV files are built on your device.

Pro is a one-time unlock. It adds page tools and on-device AI. You click, and GWB Tools reads the tab you are on: selection to PDF or Markdown, tables to CSV or Excel, a QR code for the page, emails and phone numbers, screenshots, and a head start on an invoice. On-device AI summarizes, rewrites, translates, explains, or drafts an invoice line when the browser has Chrome’s built-in model. If it does not, you get a clear message. That text is not uploaded.

Pro Plus is a monthly subscription for cloud AI: chat with the page, pull structured rows into Excel, draft an email or a quote, summarize several documents you paste in, and suggest form fields. Only the text you chose for that click is sent to our server, plus an anonymous id used to count the monthly limit. Browsing history is never sent. The extension does not contain an AI provider key.

On Pro and Pro Plus, a small note in the panel can suggest a relevant tool, such as exporting a table or summarizing a long page. It appears only when you open the extension. You can dismiss it or turn it off. The free edition shows a one-line teaser instead of running the paid action.

Test mode in the unpublished build switches Free, Pro, and Pro Plus on the device without a charge. The published build hides that switch.

## Feature bullets

- Favorites saved in the browser, with search across every tool
- Invoice, PDF, image compress, QR, sales tax, and the rest of the GWB toolset, offline
- PDF, Excel, and CSV export on your device
- Pro: selection to PDF, Markdown, or a note; tables to CSV or Excel; page QR; contacts; screenshots; invoice prefill; right-click menu
- Pro: on-device AI where the browser includes it (summary, rewrite, translate, explain, title, invoice line)
- Pro Plus: cloud chat, structured Excel, email and quote drafts, multi-document summary, form-fill suggestions
- Page tips you can dismiss or disable, computed locally
- No account for Free or Pro

## Privacy for the store form

Lead with: no account, free tools collect nothing for us, Pro stays on the device.

Then disclose Pro Plus exactly:

Pro Plus sends only the content the user chose for that action (the selection or the main text of the current page, plus any document the user pasted) and an anonymous install id for the monthly limit. It does not send browsing history, other tabs, or favorites.

Favorites may sync through the user’s own browser account (Chrome, Edge, or Firefox sync). OZOR INC LLC does not receive that list.

The full draft is `extension/store/PRIVACY.md`.

Suggested Chrome Web Store data categories:

- Free and Pro builds: no data collected by the publisher. If the form forces a choice for browser sync, say favorites are stored locally and may sync via the browser vendor, not via us.
- Pro Plus: user-provided content (the text of the action) and a non-identifying install id for rate limiting. Not browsing history. Not personally identifiable information unless the user typed it into the text they chose to send.

## Permission justifications

| Permission | Why it is there |
| --- | --- |
| storage | Save favorites, the tips on/off choice, dismissed tips, the on-device test-mode switch, the Pro Plus monthly counter, and the anonymous install id. |
| activeTab | Read the address of the tab the user opened the extension from, and only that tab. |
| scripting | After the user clicks a page action, inject a reader into that same tab. |
| contextMenus | Right-click “GWB Tools” for the Pro page actions. |
| sidePanel (Chrome and Edge only) | Open the same UI in a taller side panel. Firefox uses its sidebar instead. |

Host permissions: none in the review build. Turning on live ExtensionPay adds `https://extensionpay.com/*`. Setting a real Pro Plus server address adds that server’s origin and no other sites. Do not add `<all_urls>`.

## Icons and screenshots

- Icons: `extension/store/icons/` at 16, 19, 32, 38, 48, 64, 96, 128, 256, 512, and 1024.
- Chrome/Edge screenshots: 1280×800 PNGs in `extension/store/screenshots/` (favorites, all tools, this page, invoice, QR).

## Suggested prices (config, not charged by this repository)

- Pro lifetime: $4.99 once. ExtensionPay plan nickname `pro`.
- Pro Plus: $6.99 per month. ExtensionPay plan nickname `plus`.

Change either number in `extension/src/config.ts` before you build the store package. Confirm the current store fees and ExtensionPay’s fee on their sites before you publish. Those fees change and are not set by this project.
