# aiserve — Tasks

> Follow the session structure for each task:
>
> 1. Read the purpose
> 2. Learn the topics listed
> 3. Jot down in notebook
> 4. Build it yourself
> 5. Explain it back before moving to next task

---

## PART 1 — CLI Polish

---

## Task 1 — Fix package.json Metadata

### Purpose

Right now `package.json` has empty `author`, `description`, and `keywords`
fields. This matters the moment you publish to npm — it is the first thing
anyone reads on the npm page. It also shows you treat this project as a
real product, not a throwaway script. Filling this in properly is a
one-minute task that signals professionalism.

### What to Build

1. Open `package.json`
2. Fill in:
   - `name`: `aiserve`
   - `description`: `A CLI tool that serves any file as an AI-generated webpage`
   - `author`: your name
   - `keywords`: `["cli", "ai", "groq", "static-site", "developer-tool"]`
   - `license`: `MIT`
   - `homepage`: your GitHub repo URL
   - `repository`: `{ "type": "git", "url": "..." }`
3. Create a `LICENSE` file in the root with MIT license text

### You Will Know It Works When

`npm pack --dry-run` shows all fields populated cleanly with no warnings.

---

## Task 2 — `--port` and `--open` Flags

### Purpose

Right now the Express server inside aiserve likely runs on a hardcoded
port. If another app is already using that port, aiserve crashes with
a confusing EADDRINUSE error. Adding a `--port` flag lets the user
choose their port. Adding `--open` auto-opens the browser so the user
does not have to copy-paste a URL. These are two small additions that
make the tool feel polished and intentional.

### Learn First — search these, 20 mins max

1. commander js options flags example
   You will add `--port` and `--open` as CLI options using the
   Commander library that is already installed.
   Search: commander js program option flag nodejs example

2. nodejs detect port in use EADDRINUSE
   You will catch the error if the chosen port is already taken
   and print a helpful message instead of crashing.
   Search: nodejs express EADDRINUSE error handling

### Jot Down in Notebook

- What Commander options are vs arguments:
  Arguments: `aiserve serve myfile.txt` — positional, required
  Options: `aiserve serve myfile.txt --port 4000` — named, optional with defaults
- Why hardcoded ports are bad — two tools hardcoding port 3000 crash
  each other. Always make ports configurable with a sensible default.

### What to Build

1. In `bin/cli.js`, add `.option('--port <number>', 'port to serve on', '3000')`
   and `.option('--open', 'open browser automatically')`
2. Pass `port` to the Express server startup
3. On EADDRINUSE, print:
   `Port 3000 is already in use. Try: aiserve serve file.txt --port 4001`
4. If `--open` is passed, open `http://localhost:<port>` using the `open` package
   (install if not already present: `npm install open`)

### You Will Know It Works When

```
aiserve serve myfile.txt --port 4000 --open
```

Opens the browser at `http://localhost:4000` automatically.
Running on a taken port prints a clear message instead of a stack trace.

---

## Task 3 — `--model` Flag and Provider Abstraction

### Purpose

Right now aiserve is locked to one Groq model, hardcoded somewhere in
the services layer. If Groq changes their API or you want to test a
different model, you have to edit source code. This task adds a `--model`
flag and wraps the Groq call in a thin service interface — the first step
toward supporting multiple AI providers. This is how real tools are built.

### Learn First — search these, 20 mins max

1. javascript module pattern service layer
   You will extract the AI call into a dedicated service file so
   the CLI does not talk to Groq directly.
   Search: javascript service layer pattern module example

2. groq sdk model list nodejs
   You will find the available Groq model names so you can validate
   the user's input.
   Search: groq sdk available models nodejs

### Jot Down in Notebook

- What a service layer is — a file whose only job is to talk to one
  external thing (Groq, OpenAI, a database). The CLI calls the service;
  the service calls the API. If the API changes, you only fix one file.
- Why hardcoding model names is a code smell — it couples your tool
  to one specific string that can change at any time. Flags + defaults
  are always better.

### What to Build

1. Ensure `services/groq.js` (or equivalent) is the only file that
   imports `groq-sdk` — no direct Groq calls anywhere in `bin/` or `server/`
2. Add a `getCompletion(prompt, model)` function to the service and export it
3. Add `.option('--model <name>', 'Groq model to use', 'llama3-70b-8192')`
   to the CLI command
4. Pass the model name through to `getCompletion()`
5. If an invalid model name is passed, print the list of supported models
   and exit cleanly

### You Will Know It Works When

```
aiserve serve myfile.txt --model mixtral-8x7b-32768
```

Uses the Mixtral model. Passing a nonsense model name prints a
helpful error, not a raw API exception.

---

## Task 4 — `--prompt` Flag for Custom Prompts

### Purpose

The `/prompts` directory holds the instructions sent to the AI. Right now
users cannot change them without editing source files. A `--prompt` flag
lets the user pass their own prompt template, completely changing how the
webpage is generated — documentation style, blog post style, presentation
style, anything. This turns aiserve from a fixed tool into a flexible one.

### Learn First — search these, 20 mins max

1. nodejs fs readFileSync text file
   You will read the user's prompt file from disk before sending it
   to the AI.
   Search: nodejs fs readFileSync read text file example

2. javascript string template interpolation variable
   Your prompt template will have a placeholder like `{{content}}`
   that gets replaced with the actual file contents at runtime.
   Search: javascript string replace all occurrences variable

### Jot Down in Notebook

- What a prompt template is — a text file with placeholders.
  The tool fills in the placeholders at runtime before sending to AI.
  This is how every serious AI tool works internally.
- The difference between a system prompt and a user prompt:
  System prompt: tells the AI who it is and how to behave
  User prompt: the actual content/question being sent

### What to Build

1. Add `.option('--prompt <file>', 'path to custom prompt template file')`
   to the CLI command
2. If `--prompt` is passed, read that file from disk
3. Replace `{{content}}` in the template with the file's actual content
4. If `--prompt` is not passed, use the default prompt from `/prompts/`
5. If the prompt file does not exist, print a clear error and exit

### You Will Know It Works When

Create a file `my-prompt.txt` containing:

```
Turn the following into a blog post webpage: {{content}}
```

Then run:

```
aiserve serve myfile.txt --prompt ./my-prompt.txt
```

The generated page looks like a blog post instead of the default style.

---

## Task 5 — `--theme` Flag

### Purpose

Every generated webpage currently looks the same. A `--theme` flag lets
the user control the visual style — dark, light, minimal, or docs.
The theme is injected as a CSS block into the generated HTML. This is
a small addition with a big visible effect — users immediately see
aiserve is controllable, not a black box.

### Learn First — search these, 20 mins max

1. css variables custom properties example
   Each theme will be a set of CSS custom properties (variables)
   that control colors, fonts, and spacing.
   Search: css custom properties variables example

2. javascript object lookup map pattern
   You will store the four themes as an object and look up
   the selected one by name.
   Search: javascript object as lookup map pattern

### Jot Down in Notebook

- What CSS custom properties are — variables defined in `:root {}`
  that any CSS rule can reference with `var(--name)`. Changing the
  theme means swapping one block of variable definitions.
- Why injecting styles into generated HTML is powerful — the AI
  generates the structure, you control the look. Clean separation.

### What to Build

1. Create `utils/themes.js` with four theme objects:
   - `dark`: black background, white text, monospace font
   - `light`: white background, dark text, sans-serif font
   - `minimal`: off-white, very little styling
   - `docs`: looks like documentation (think Notion or MDN)
2. Each theme is a CSS string using custom properties
3. Add `.option('--theme <name>', 'visual theme', 'light')` to the CLI
4. Inject the theme CSS into the `<head>` of the generated HTML
5. If an invalid theme is passed, list the valid options and exit

### You Will Know It Works When

```
aiserve serve myfile.txt --theme dark
```

Generates a dark-themed webpage.

```
aiserve serve myfile.txt --theme badname
```

Prints: `Invalid theme. Choose from: dark, light, minimal, docs`

---

## Task 6 — `--export` Flag (Save to Disk)

### Purpose

Right now aiserve only serves the generated page in a browser. There
is no way to save it. A `--export` flag saves the generated HTML to a
file on disk instead of (or alongside) serving it. This is how you use
aiserve to generate documentation, changelogs, and README pages that
can be committed to a repo or deployed anywhere.

### Learn First — search these, 20 mins max

1. nodejs fs writeFileSync write html file
   You will write the generated HTML string to a file on disk.
   Search: nodejs fs writeFileSync create file example

2. nodejs path join dirname
   You will use `path.join()` to safely build the output file path
   regardless of the OS.
   Search: nodejs path join example

### Jot Down in Notebook

- When to use `writeFileSync` vs `writeFile`:
  `writeFileSync` — blocks until done, simpler for CLI tools
  `writeFile` — async callback, better for servers handling many requests
- Why path.join() matters — file paths use `\` on Windows and `/` on Mac/Linux.
  `path.join()` handles this for you automatically.

### What to Build

1. Add `.option('--export <path>', 'save generated HTML to this file path')`
2. After the AI generates the HTML:
   - If `--export` is passed, write HTML to that path
   - Print: `Saved to ./output/myfile.html`
   - Still serve it in the browser unless `--no-serve` is also passed
3. If the output directory does not exist, create it automatically with
   `fs.mkdirSync(dir, { recursive: true })`

### You Will Know It Works When

```
aiserve serve myfile.txt --export ./output/myfile.html
```

Creates `output/myfile.html` on disk with the full generated HTML.
Opening it directly in a browser works without any server.

---

## Task 7 — `--watch` Flag (Live Reload)

### Purpose

Right now if you edit the source file, you have to stop aiserve and
restart it to see the new output. `--watch` monitors the file for changes
and automatically regenerates the page. This is essential for any workflow
where you are actively writing content and want to preview the AI output
as you go — documentation, notes, changelogs.

### Learn First — search these, 20 mins max

1. nodejs fs watchFile watch for changes
   You will use Node's built-in `fs.watch()` to detect when the
   source file is modified.
   Search: nodejs fs watch file changes example

2. server sent events nodejs express
   When the file changes, you need to notify the browser to reload.
   SSE is simpler than WebSockets for one-way server-to-browser messages.
   Search: server sent events express nodejs example

### Jot Down in Notebook

- What `fs.watch()` does — registers a callback that fires whenever
  a file is modified, renamed, or deleted.
- SSE vs WebSockets:
  SSE — one direction only (server to browser), simple, built into browsers
  WebSockets — two directions, more complex, needed for chat/games
  For live reload, SSE is always the right choice.

### What to Build

1. Add `.option('--watch', 'watch file for changes and regenerate')`
2. If `--watch` is passed:
   - Use `fs.watch(filePath)` to detect changes
   - On change, re-run the AI generation and update the served HTML
   - Add a `GET /events` SSE endpoint to the Express server
   - Inject a small `<script>` into the HTML that connects to `/events`
     and calls `location.reload()` when a reload event is received
3. Print: `Watching myfile.txt for changes...` after startup

### You Will Know It Works When

```
aiserve serve myfile.txt --watch
```

Edit and save `myfile.txt`. The browser tab reloads automatically
within 2–3 seconds showing the newly generated page.

---

## PART 2 — Multi-File and Directory Support

---

## Task 8 — Serve a Directory

### Purpose

Right now aiserve only accepts a single file. Passing a folder should
generate a separate webpage for each file and produce a navigation index
page linking them all. This is what makes aiserve useful for real
projects — serve an entire `docs/` folder as a mini website in one command.

### Learn First — search these, 20 mins max

1. nodejs fs readdirSync list files in folder
   You will scan the given directory to find all files to process.
   Search: nodejs fs readdirSync list files example

2. nodejs path extname file extension
   You will filter files by extension — only process `.txt`, `.md`,
   `.json`, `.csv` etc, and skip binaries.
   Search: nodejs path extname get file extension

### Jot Down in Notebook

- What `readdirSync` returns — an array of filenames (not full paths).
  Use `path.join(dirPath, filename)` to get the full path for each.
- Why filtering by extension matters — a directory might contain
  `.png`, `.DS_Store`, `.gitignore`. You only want text files.

### Supported File Types

`.txt`, `.md`, `.json`, `.csv`, `.js`, `.ts`, `.py`, `.html`, `.yaml`, `.yml`

### What to Build

1. Update the CLI to accept either a file path or a directory path
2. If a directory is passed:
   - Scan it with `readdirSync`
   - Filter to supported extensions only
   - Generate one HTML page per file (can reuse existing generation logic)
   - Generate an `index.html` that lists all files as clickable links
3. Serve the whole output from Express with proper routing:
   `GET /` → index page
   `GET /myfile` → that file's generated page
4. Print progress as each file is processed:
   `[1/4] Generating myfile.txt...`
   `[2/4] Generating notes.md...`

### You Will Know It Works When

```
aiserve serve ./docs
```

Generates pages for all supported files in `./docs`, serves an index
at `http://localhost:3000`, and each file link opens its own page.

---

## Task 9 — Caching Generated Pages

### Purpose

Right now every run sends the file to the AI and waits for a response.
If the file has not changed since last time, this wastes time and API
credits. A simple cache stores the generated HTML alongside a hash of
the source file. If the hash matches, serve the cached version instantly.
This is how every serious build tool works — only rebuild what changed.

### Learn First — search these, 20 mins max

1. nodejs crypto createHash md5 file
   You will hash the file contents to get a fingerprint. If the file
   changes, the hash changes.
   Search: nodejs crypto createHash file hash example

2. nodejs json cache read write file
   Your cache will be a simple JSON file stored in `.aiserve/cache.json`
   mapping file hashes to generated HTML.
   Search: nodejs read write json file cache example

### Jot Down in Notebook

- What a hash is — a fixed-length fingerprint of any data. Same input
  always produces the same hash. One character change = completely
  different hash. MD5 or SHA-256 are common choices.
- Cache invalidation — the process of deciding when to throw away
  a cached result and recompute. Here: if hash changes, cache is stale.

### What to Build

1. Create `utils/cache.js` with two functions:
   - `getCached(filePath)` — returns cached HTML if hash matches, else null
   - `setCache(filePath, html)` — saves generated HTML with current hash
2. Cache file lives at `.aiserve/cache.json` in the project root
3. In the generation flow:
   - Check cache first
   - If hit: serve cached HTML, print `[cache] myfile.txt`
   - If miss: generate with AI, save to cache, serve result
4. `--no-cache` flag bypasses the cache and forces regeneration

### You Will Know It Works When

Run `aiserve serve myfile.txt` twice in a row.
First run hits the AI. Second run prints `[cache] myfile.txt`
and responds in under 100ms.

---

## PART 3 — Multi-Provider AI Support

---

## Task 10 — OpenAI Provider

### Purpose

aiserve currently only works if you have a Groq API key. Many developers
already have an OpenAI key. Adding an OpenAI provider doubles aiserve's
potential user base immediately. This task also forces you to write clean
provider abstraction — if adding OpenAI only requires adding one file and
one entry in a config, your architecture is correct.

### Learn First — search these, 20 mins max

1. openai nodejs sdk chat completion example
   You will use the official `openai` npm package.
   Search: openai nodejs sdk chat completion example

2. javascript interface pattern multiple providers
   You will write both providers to expose the same function signature:
   `getCompletion(prompt, model, apiKey)`.
   Search: javascript consistent interface multiple implementations

### Jot Down in Notebook

- What provider abstraction means — the calling code (CLI) does not
  know or care whether it is talking to Groq or OpenAI. It calls
  `provider.getCompletion()` and gets HTML back. Only the provider
  file knows the API details.
- This is the same pattern used by every database ORM, every cloud SDK
  wrapper, and every payment processor library.

### What to Build

1. Install: `npm install openai`
2. Create `services/openai.js` with `getCompletion(prompt, model, apiKey)`
3. Rename/refactor `services/groq.js` to match the same function signature
4. Create `services/index.js` as a provider router:

   ```js
   export function getProvider(name) {
     if (name === "openai") return openaiProvider;
     if (name === "groq") return groqProvider;
     throw new Error(`Unknown provider: ${name}`);
   }
   ```

5. Add `.option('--provider <name>', 'AI provider to use', 'groq')` to CLI
6. Update `.env.example` with both `GROQ_API_KEY` and `OPENAI_API_KEY`

### You Will Know It Works When

```
aiserve serve myfile.txt --provider openai --model gpt-4o-mini
```

Generates the page using OpenAI. The same file with `--provider groq`
uses Groq. Both produce valid HTML.

---

## Task 11 — Ollama Provider (Local AI)

### Purpose

Not everyone wants to send their files to a cloud API. Developers working
on private codebases or sensitive documents need a local option. Ollama
runs AI models entirely on your machine — no API key, no internet, no data
leaving your laptop. Adding Ollama as a provider makes aiserve usable in
private and enterprise environments.

### Learn First — search these, 20 mins max

1. ollama local API nodejs fetch example
   Ollama exposes a local REST API at `http://localhost:11434`.
   You will call it with plain `fetch()` — no SDK needed.
   Search: ollama local API nodejs fetch example

2. nodejs fetch abort timeout controller
   Local AI can be slow. You will add a timeout so the tool does not
   hang forever if Ollama is not running.
   Search: nodejs fetch timeout AbortController example

### Jot Down in Notebook

- What Ollama is — a tool that runs open-source AI models (Llama, Mistral,
  Gemma) locally on your computer's CPU or GPU with a simple REST API.
- Why local AI matters — no API costs, no rate limits, works offline,
  data never leaves your machine. Increasingly important for enterprises.

### What to Build

1. Create `services/ollama.js` with `getCompletion(prompt, model)`
   - Default model: `llama3`
   - Calls `http://localhost:11434/api/generate`
   - Includes a 30-second timeout using AbortController
2. Register `ollama` in `services/index.js` provider router
3. If Ollama is not running, catch the connection error and print:
   `Ollama is not running. Start it with: ollama serve`

### You Will Know It Works When

With Ollama installed and running locally:

```
aiserve serve myfile.txt --provider ollama --model llama3
```

Generates the page without any internet connection or API key.

---

## PART 4 — Config File

---

## Task 12 — `aiserve.config.js` Support

### Purpose

Right now every aiserve command requires you to pass `--provider`,
`--model`, `--port`, and `--theme` every single time. A config file
lets you set your defaults once per project so you never have to repeat
them. This is how every mature CLI tool works — Vite, ESLint, Prettier,
Tailwind all read from a config file in the project root.

### Learn First — search these, 20 mins max

1. nodejs dynamic import json config file
   You will load `aiserve.config.js` from the current working directory
   if it exists.
   Search: nodejs dynamic import local config file example

2. javascript object spread merge defaults
   You will merge the config file values with CLI flag values, letting
   flags override config settings.
   Search: javascript object spread merge two objects override defaults

### Jot Down in Notebook

- Config file precedence order (highest to lowest):
  1. CLI flags (always win)
  2. `aiserve.config.js` in project root
  3. Built-in defaults
     This is the standard pattern used by every config-aware CLI tool.
- Why this matters — teams can commit `aiserve.config.js` to the repo
  so everyone uses the same settings without passing flags.

### What to Build

1. Create `utils/config.js` with a `loadConfig()` function that:
   - Looks for `aiserve.config.js` in `process.cwd()`
   - If found, dynamically imports it and returns the default export
   - If not found, returns `{}`
2. In the CLI startup, merge: `{ ...defaults, ...fileConfig, ...cliFlags }`
3. Create an `aiserve init` command that generates a starter config:

```js
// aiserve.config.js
export default {
  provider: "groq",
  model: "llama3-70b-8192",
  port: 3000,
  theme: "light",
  open: true,
};
```

### You Will Know It Works When

Create `aiserve.config.js` with `theme: 'dark'` and `port: 4000`.
Run `aiserve serve myfile.txt` with no flags.
The page serves on port 4000 with the dark theme — config was read correctly.

---

## PART 5 — Developer Experience

---

## Task 13 — Better Error Messages

### Purpose

Right now when something goes wrong — missing API key, file not found,
bad model name — aiserve either crashes with a raw Node.js stack trace
or silently does nothing. Proper error messages tell the developer exactly
what went wrong and exactly what to do next. This is what separates
professional tools from scripts.

### Learn First — search these, 20 mins max

1. nodejs process exit code error handling
   You will use `process.exit(1)` to signal failure and print
   helpful messages before exiting.
   Search: nodejs process exit error code best practice

### Jot Down in Notebook

- Exit codes: `0` means success, `1` means error. Any automation or CI
  system that runs aiserve will check this exit code.
- The anatomy of a good CLI error message:
  1. What went wrong (clear, one sentence)
  2. Why it went wrong (if not obvious)
  3. What to do next (exact command or link)

### Error Scenarios to Handle

| Situation             | Message to Print                                                |
| --------------------- | --------------------------------------------------------------- |
| File not found        | `File not found: ./myfile.txt`                                  |
| No API key in .env    | `GROQ_API_KEY is not set. Add it to your .env file.`            |
| Invalid provider      | `Unknown provider "xyz". Choose from: groq, openai, ollama`     |
| Invalid theme         | `Invalid theme "xyz". Choose from: dark, light, minimal, docs`  |
| Port in use           | `Port 3000 is taken. Try: aiserve serve file.txt --port 3001`   |
| Ollama not running    | `Ollama is not running. Start it with: ollama serve`            |
| Unsupported file type | `Unsupported file type: .png. Supported: txt, md, json, csv...` |

### What to Build

1. Create `utils/errors.js` with named error thrower functions for each case
2. Wrap all major operations in try/catch with these error functions
3. Never print a stack trace to the user — only print the message
4. Print stack traces only if `--debug` flag is passed

### You Will Know It Works When

Delete your `.env` file and run `aiserve serve myfile.txt`.
Instead of a stack trace you see:
`GROQ_API_KEY is not set. Add it to your .env file.`

---

## Task 14 — `aiserve --version` and `aiserve help`

### Purpose

Every CLI tool should respond to `--version` and `--help`. These are
not optional — they are the first two things any new user tries.
Commander handles most of this automatically but the help output needs
to be clean and the version needs to be read dynamically from
`package.json`, not hardcoded.

### Learn First — search these, 20 mins max

1. commander js custom help text addHelpText
   You will add a usage example section to the help output.
   Search: commander js addHelpText example

2. nodejs import package json version ESM
   In ESM modules, importing package.json for the version number
   requires a special approach.
   Search: nodejs ESM import package.json version

### What the Help Output Should Look Like

```
aiserve — serve any file as an AI-generated webpage

Usage:
  aiserve serve <file>      Serve a single file
  aiserve serve <dir>       Serve all files in a directory
  aiserve init              Create aiserve.config.js

Options:
  --port <number>     Port to serve on (default: 3000)
  --open              Open browser automatically
  --theme <name>      Visual theme: dark, light, minimal, docs
  --provider <name>   AI provider: groq, openai, ollama
  --model <name>      Model name for the chosen provider
  --prompt <file>     Custom prompt template file
  --export <path>     Save generated HTML to file
  --watch             Regenerate on file change
  --no-cache          Skip cache and force regeneration
  --debug             Show full error stack traces

Examples:
  aiserve serve README.md --theme dark --open
  aiserve serve ./docs --provider openai --export ./site
  aiserve serve notes.txt --watch --port 4000
```

### You Will Know It Works When

`aiserve --version` prints the exact version from `package.json`.
`aiserve --help` shows the formatted output above.

---

## Task 15 — Publish to npm

### Purpose

aiserve is a real tool. Real tools are published to npm so anyone
can install them with `npm install -g aiserve` or run them instantly
with `npx aiserve`. This is the final step that takes a project from
"code on my laptop" to "a tool other developers can use."

### Learn First — search these, 20 mins max

1. npm publish scoped package nodejs CLI
   Search: npm publish CLI tool nodejs how to

2. npx run without install how it works
   Search: npx run package without installing how it works

### Jot Down in Notebook

- What `bin` in `package.json` does — tells npm which file to run
  when someone types the command name. Already set up as `aiserve → ./bin/cli.js`.
- The difference between local and global installs:
  `npm install -g aiserve` — installs once, works from anywhere in terminal
  `npx aiserve` — downloads temporarily and runs, no permanent install
- Why `.npmignore` matters — keeps test files, config files, and dev
  assets out of the published package. Smaller, cleaner download.

### What to Build

1. Create `.npmignore` to exclude: `.env`, `*.bak`, test files, `.aiserve/`
2. Verify `bin/cli.js` has `#!/usr/bin/env node` as its first line
3. Run `npm pack` and inspect the tarball contents — make sure only the
   right files are included
4. Create an npm account if you don't have one
5. Run `npm publish`
6. Test the published package:

   ```
   npx aiserve serve README.md
   ```

### You Will Know It Works When

On a different machine or in a fresh terminal with no local clone:

```
npx aiserve serve README.md --open
```

Downloads and runs aiserve, generates and opens the webpage.

---

## Mini Project Complete 🎉

After Task 15 you have:

- A polished CLI with full flag support and clean error messages
- Multi-file and directory serving
- Response caching for speed
- Three AI providers: Groq, OpenAI, Ollama
- Config file support
- Live watch mode
- HTML export
- Published on npm and runnable with npx

This is your mini project submission.

---

## What Comes Next

Task 16 — React dashboard UI (visual file browser for the generated pages)
Task 17 — PDF and image file support via multimodal AI
Task 18 — Deploy generated sites to Vercel/Netlify with one command
Task 19 — Team sharing mode with a public URL (ngrok or Cloudflare tunnel)
Task 20 — Rewrite the server in Go for speed → this becomes aiserve v2
