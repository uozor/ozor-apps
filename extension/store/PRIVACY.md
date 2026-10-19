# GWB Tools privacy policy (draft)

**Product:** GWB Tools
**Publisher:** OZOR INC LLC
**Contact:** gwm.tech@greaterworldmedia.tech
**Website:** https://greaterworldmedia.tech/

This draft is for the extension stores. It is not the privacy page of the public website. Paste it into each store’s privacy form, and publish it at a URL you control if a store asks for one.

## The short version

GWB Tools does not run an account system. Free tools and Pro page tools run in the browser. Files you open stay on the device.

Pro Plus is the only feature that sends text to a server, and it sends only the text you chose for that click. It does not send browsing history.

## Free

Favorites, search, and the business tools (invoice, PDF, image compress, QR, sales tax, and the rest) run on your device. Nothing you type or upload is sent to OZOR INC LLC.

Your favorites list is saved with the browser’s storage. If you are signed in to Chrome, Edge, or Firefox sync, the browser may sync that list the same way it syncs bookmarks. OZOR INC LLC does not receive it and does not operate that sync.

## Pro (one-time unlock)

Page tools and on-device AI run when you click them, on the tab you are using.

- Reading the page, screenshots, tables, contacts, and QR codes stays on the device.
- On-device AI uses the browser’s built-in model (Chrome’s Gemini Nano APIs: Summarizer, Prompt, Writer, Rewriter, Translator, Language Detector) when that browser has it. The text is not uploaded.
- If this browser has no built-in model, the feature says so. It does not quietly switch to a cloud model.

Page tips look at the current tab only after you open GWB Tools or click “Check this page.” The check stays on the device. You can dismiss a tip or turn tips off. Tips are not a record of sites you visited.

## Pro Plus (subscription)

Pro Plus cloud actions (chat with this page, structured Excel, email and quote drafts, multi-document summary, form-field suggestions) send a request to a server operated for OZOR INC LLC. That server then calls a model provider. On Firefox, the browser asks the first time, and the send waits until that permission is allowed.

**What is sent**

- The task you clicked (for example, “chat” or “draft an email”).
- The text for that action: your selection, or the main text of the current page if you did not select anything.
- Any extra document you pasted into the box yourself.
- A random install id created in this browser, used only to count the monthly request limit.
- If a future sign-in is added, a bearer token for that session. The current build does not create accounts.

**What is not sent**

- Browsing history.
- A list of open tabs or other sites.
- Pages you did not run a Pro Plus action on.
- Favorites.
- The model API key. That key lives only on the server.

The server is not supposed to store the text after it answers. The extension also counts requests on the device (200 per calendar month in the default config) so the limit still applies if a reply is lost.

Payment is handled by the store’s payment partner (ExtensionPay with Stripe on Chrome, Edge, and Firefox, or the Apple and Microsoft stores on those builds). OZOR INC LLC does not receive your card number.

## Permissions

The extension can read a page only after you click a page action, using the browser’s active-tab permission, unless you later configure a Pro Plus server address. That address, and ExtensionPay’s address when payments are turned on, are the only sites the extension is allowed to contact. The build shipped for review has no site permissions while those addresses are still placeholders.

## Children

GWB Tools is a business tool. It is not directed at children under 13.

## Changes

The store listing will be updated when this policy changes. The prices and the server address are configuration values in the extension and can change without changing this promise: Pro Plus still sends only the text you chose, and never browsing history.
