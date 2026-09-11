# AI Keyboard Backend

Node.js + TypeScript backend for the AI-powered Android keyboard application.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
AI_PROVIDER=openai
AI_API_KEY=sk-...your-openai-key...
AI_MODEL=gpt-4o-mini
PORT=5000
NODE_ENV=development
```

### 3. Run development server

```bash
npm run dev
```

The server starts at `http://localhost:5000` with hot-reload via `ts-node-dev`.

### 4. Build for production

```bash
npm run build
```

Output goes to `dist/`.

### 5. Start production server

```bash
npm start
```

---

## Environment Variables

| Variable                  | Default       | Description                                              |
|---------------------------|---------------|----------------------------------------------------------|
| `PORT`                    | `5000`        | HTTP port                                                |
| `NODE_ENV`                | `development` | `development` or `production`                            |
| `AI_PROVIDER`             | `openai`      | `openai`, `gemini` (stub), or `mock`                     |
| `AI_API_KEY`              | –             | API key for the selected provider (not needed for mock)  |
| `AI_MODEL`                | `gpt-4o-mini` | Model name passed to the provider                        |
| `AI_TIMEOUT_MS`           | `30000`       | Provider request timeout in ms                           |
| `ALLOWED_ORIGINS`         | `""`          | Comma-separated CORS origins (empty = allow all)         |
| `RATE_LIMIT_WINDOW_MS`    | `60000`       | Rate limit window in ms                                  |
| `RATE_LIMIT_MAX_REQUESTS` | `30`          | Max requests per window per IP                           |
| `MAX_TEXT_LENGTH`         | `2000`        | Max characters accepted in the `text` field              |

---

## Available Providers

| Value    | Status      | Notes                                        |
|----------|-------------|----------------------------------------------|
| `openai` | ✅ Ready     | Requires `AI_API_KEY`. Uses Chat Completions. |
| `mock`   | ✅ Ready     | No API key needed. Use for dev/testing.       |
| `gemini` | 🔧 Stub     | Install `@google/generative-ai` and implement `src/services/ai/providers/gemini.provider.ts`. |

To add a new provider, implement the `AIProvider` interface and add a case to `aiProviderFactory.ts`.

---

## Endpoints

### `GET /health`

Liveness check. Does not call the AI provider.

**Response:**
```json
{ "success": true, "status": "ok" }
```

---

### `POST /api/ai/rewrite`

Rewrites text according to a specified action.

**Request:**
```json
{
  "text": "sir im still facing same issue",
  "action": "fix"
}
```

**Response:**
```json
{
  "success": true,
  "result": "Sir, I'm still facing the same issue.",
  "requestId": "48de4b266ba94936"
}
```

**Supported actions:**

| Action         | Description                                          |
|----------------|------------------------------------------------------|
| `fix`          | Correct grammar, spelling, punctuation (minimal changes) |
| `professional` | Polished, professional workplace tone                |
| `friendly`     | Warm, friendly conversational tone                   |
| `shorten`      | Concise while preserving full meaning                |
| `polite`       | Respectful and polite tone                           |
| `formal`       | Formal English, no contractions                      |
| `casual`       | Relaxed casual English                               |
| `academic`     | Clear academic English                               |
| `improve`      | Improve clarity and naturalness                      |
| `custom`       | Custom instruction (requires `instruction` field)    |

**Custom instruction example:**
```json
{
  "text": "i need this report tomorrow",
  "action": "custom",
  "instruction": "Make this sound respectful but urgent."
}
```

**Error response:**
```json
{
  "success": false,
  "error": "Text is required.",
  "requestId": "48de4b266ba94936"
}
```

---

## HTTP Status Codes

| Code | Meaning                        |
|------|--------------------------------|
| 200  | Success                        |
| 400  | Invalid request / validation   |
| 404  | Route not found                |
| 429  | Rate limit exceeded            |
| 500  | Unexpected server error        |
| 502  | AI provider error              |
| 503  | AI provider unavailable        |
| 504  | AI provider timeout            |

---

## curl Examples

**Health check:**
```bash
curl http://localhost:5000/health
```

**Fix grammar:**
```bash
curl -X POST http://localhost:5000/api/ai/rewrite \
  -H "Content-Type: application/json" \
  -d '{"text": "sir im still facing same issue", "action": "fix"}'
```

**Professional tone:**
```bash
curl -X POST http://localhost:5000/api/ai/rewrite \
  -H "Content-Type: application/json" \
  -d '{"text": "send me the file", "action": "professional"}'
```

**Polite:**
```bash
curl -X POST http://localhost:5000/api/ai/rewrite \
  -H "Content-Type: application/json" \
  -d '{"text": "send me the file", "action": "polite"}'
```

**Custom instruction:**
```bash
curl -X POST http://localhost:5000/api/ai/rewrite \
  -H "Content-Type: application/json" \
  -d '{"text": "i need this report tomorrow", "action": "custom", "instruction": "Make this sound respectful but urgent."}'
```

---

## Android Connection Contract

The Android keyboard needs only:

```
BASE_URL = http://<your-server-ip>:5000
ENDPOINT = POST /api/ai/rewrite
Content-Type: application/json
```

**Request body:**
```json
{
  "text": "<selected text from keyboard>",
  "action": "<selected action>"
}
```

**Success response:**
```json
{
  "success": true,
  "result": "<rewritten text>",
  "requestId": "<id for debugging>"
}
```

**Error response:**
```json
{
  "success": false,
  "error": "<human-readable error message>",
  "requestId": "<id>"
}
```

The Android client should check `success === true` before using `result`.

---

## Development / Mock Mode

Use `AI_PROVIDER=mock` to test without spending API credits:

```env
AI_PROVIDER=mock
AI_API_KEY=   # not required
```

The mock provider returns deterministic responses. Switching to a real provider requires only changing `AI_PROVIDER` and `AI_API_KEY` in `.env`.

---

## Tests

```bash
npm test
```

```bash
npm run test:coverage
```

Tests cover all 10 actions, empty/invalid input, text length limits, custom instruction validation, provider failure simulation, rate limiting, and the health endpoint.

---

## Project Structure

```
src/
├── app.ts                          # Express app factory + server entry
├── config/
│   └── index.ts                    # Environment configuration
├── controllers/
│   ├── ai.controller.ts            # POST /api/ai/rewrite handler
│   └── health.controller.ts        # GET /health handler
├── middleware/
│   ├── errorHandler.middleware.ts  # Central error handler
│   └── requestId.middleware.ts     # Attaches request ID to each request
├── routes/
│   ├── ai.routes.ts
│   └── health.routes.ts
├── services/
│   └── ai/
│       ├── aiProviderFactory.ts    # Creates the configured provider
│       ├── aiService.ts            # Orchestrates provider call + logging
│       ├── prompts.ts              # System prompt + action instructions
│       └── providers/
│           ├── openai.provider.ts  # OpenAI implementation
│           ├── mock.provider.ts    # Mock implementation
│           └── gemini.provider.ts  # Gemini stub
├── types/
│   └── index.ts                    # Shared types and interfaces
├── utils/
│   ├── logger.ts                   # Structured logger (privacy-safe)
│   └── requestId.ts                # Request ID generator
├── validators/
│   └── rewrite.validator.ts        # Zod schema for rewrite request
└── __tests__/
    ├── setup.ts                    # Jest setup (forces mock provider)
    ├── health.test.ts
    └── rewrite.test.ts
```

---

## Privacy

- User text is **never logged**
- Only safe metadata is logged: `requestId`, `action`, `inputLength`, `outputLength`, `elapsedMs`
- API keys are never sent to the Android client
- No message content is stored in any database

---

## Adding a New Provider

1. Create `src/services/ai/providers/<name>.provider.ts`
2. Implement the `AIProvider` interface:
   ```typescript
   export class MyProvider implements AIProvider {
     async rewriteText(text: string, action: RewriteAction, instruction?: string): Promise<string> {
       // call your API, return rewritten text
     }
   }
   ```
3. Add a case in `src/services/ai/aiProviderFactory.ts`
4. Add the provider name to the `ProviderName` type in `src/types/index.ts`
5. Update `.env.example`
