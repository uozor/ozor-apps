# Pro Plus proxy (stub)

This folder is a starting point for the small server that Pro Plus talks to. It is not deployed, and it does not create accounts. Leave it on your own machine until you are ready to host it.

The extension never contains a model API key. The key stays here, in the server environment.

## What the extension sends

Only when a Pro Plus user clicks a cloud action:

| Field | Meaning |
| --- | --- |
| `task` | One of `chat`, `extract-structured`, `draft-email`, `draft-quote`, `multi-summary`, `form-fill` |
| `content` | The selection, or the main text of the current page, whichever the user action used |
| `documents` | Extra text the user pasted into the “Extra documents” box |
| `hint` | Optional short instruction |
| `client` | Always `gwb-tools` |
| header `x-gwb-install` | A random id created on that browser, used only to count the monthly limit |

The body has no browsing history, no list of tabs, and no other pages. The server should not log `content`.

The response is JSON: `{ "text": "...", "remaining": 199 }`.

## Run the stub locally

From `extension/`:

```bash
node backend/server.mjs
```

With no key, it listens on `http://127.0.0.1:8788/v1/ai` and returns a stub sentence. To call a real model, set the variables in the server environment (not in the extension):

```bash
export GWB_AI_API_KEY="your key"
export GWB_AI_BASE_URL="https://api.openai.com/v1/chat/completions"
export GWB_AI_MODEL="gpt-4o-mini"
node backend/server.mjs
```

`GWB_AI_BASE_URL` can be any OpenAI-compatible chat-completions endpoint. Swap the provider by changing those three variables. The extension does not change.

The stub counts requests in memory, 200 per install per UTC month (`GWB_MONTHLY_LIMIT` changes that). A hosted version should store that count somewhere durable. The extension also keeps its own counter so a lost response still counts.

## Point the extension at it

1. In `src/config.ts`, set `backendUrl` to your public `https://…/v1/ai` address.
2. Rebuild the extension. The build adds a host permission for that origin only.
3. The placeholder address (`REPLACE-WITH-YOUR-PROXY`) adds no host permission. In test mode the extension shows a mock reply and does not call the network.

Do not ship the API key inside the extension, a screenshot, or this repository.
