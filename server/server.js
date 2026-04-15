import express from "express";
import { generateHTML } from "../services/aiService.js";
import { readFile } from "../utils/fileReader.js";
import { systemPrompt } from "../prompts/articlePrompt.js";
import {
  getFileHash,
  getCachedHTML,
  saveCache,
  deleteCachedHTML,
} from "../utils/cache.js";

function injectRegenerateControls(html) {
  const controls = `
<button id="aiserve-regenerate-btn" type="button">Regenerate Page</button>
<button id="aiserve-change-prompt-btn" type="button">Change Prompt Text</button>
<script>
  (function () {
    const regenerateButton = document.getElementById("aiserve-regenerate-btn");
    const changePromptButton = document.getElementById("aiserve-change-prompt-btn");

    if (!regenerateButton || !changePromptButton) return;

    async function runRequest(url, body) {
      regenerateButton.disabled = true;
      changePromptButton.disabled = true;
      const originalRegenerateText = regenerateButton.textContent;
      regenerateButton.textContent = "Regenerating...";

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) throw new Error("Regeneration failed");
        window.location.reload();
      } catch (error) {
        alert("Failed to regenerate page. Check server logs.");
      } finally {
        regenerateButton.disabled = false;
        changePromptButton.disabled = false;
        regenerateButton.textContent = originalRegenerateText;
      }
    }

    regenerateButton.addEventListener("click", async function () {
      await runRequest("/regenerate");
    });

    changePromptButton.addEventListener("click", async function () {
      try {
        const promptResponse = await fetch("/current-prompt");
        if (!promptResponse.ok) throw new Error("Could not load prompt");

        const payload = await promptResponse.json();
        const editedPrompt = window.prompt("Edit prompt text", payload.prompt || "");

        if (editedPrompt === null) {
          return;
        }

        if (!editedPrompt.trim()) {
          alert("Prompt cannot be empty");
          return;
        }

        await runRequest("/regenerate-with-prompt", { prompt: editedPrompt });
      } catch (error) {
        alert("Failed to update prompt. Check server logs.");
      }
    });
  })();
</script>
<style>
  #aiserve-regenerate-btn {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 9999;
    border: 0;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 600;
    background: #111827;
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
  }

  #aiserve-change-prompt-btn {
    position: fixed;
    top: 16px;
    right: 170px;
    z-index: 9999;
    border: 0;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 600;
    background: #0f766e;
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
  }

  #aiserve-regenerate-btn:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }

  #aiserve-change-prompt-btn:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }
</style>
`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${controls}\n</body>`);
  }

  return `${html}\n${controls}`;
}

export async function startServer(filePath) {
  const app = express();
  app.use(express.json());

  let currentPrompt = systemPrompt;
  let currentHash = null;
  let html = null;
  let isRegenerating = false;

  async function buildPage({ forceRegenerate = false, nextPrompt = null } = {}) {
    if (typeof nextPrompt === "string") {
      currentPrompt = nextPrompt;
    }

    const content = readFile(filePath);
    const nextHash = getFileHash(`${currentPrompt}\n::\n${content}`);

    if (!forceRegenerate) {
      const cached = getCachedHTML(nextHash);

      if (cached) {
        currentHash = nextHash;
        html = injectRegenerateControls(cached);
        console.log(" Using cached website");
        return;
      }
    }

    if (forceRegenerate && currentHash) {
      deleteCachedHTML(currentHash);
      console.log(" Deleted existing cache");
    }

    console.log(" Generating website using AI...");
    const generatedHTML = await generateHTML(content, currentPrompt);

    saveCache(nextHash, generatedHTML);

    currentHash = nextHash;
    html = injectRegenerateControls(generatedHTML);
    console.log(" Saved new cache");
  }

  await buildPage();

  app.get("/", (req, res) => {
    res.send(html);
  });

  app.post("/regenerate", async (req, res) => {
    if (isRegenerating) {
      return res.status(409).json({ message: "Regeneration already in progress" });
    }

    isRegenerating = true;

    try {
      await buildPage({ forceRegenerate: true });
      res.status(200).json({ message: "Regenerated" });
    } catch (error) {
      console.error(" Failed to regenerate website", error);
      res.status(500).json({ message: "Failed to regenerate" });
    } finally {
      isRegenerating = false;
    }
  });

  app.get("/current-prompt", (req, res) => {
    res.status(200).json({ prompt: currentPrompt });
  });

  app.post("/regenerate-with-prompt", async (req, res) => {
    if (isRegenerating) {
      return res.status(409).json({ message: "Regeneration already in progress" });
    }

    const prompt = req.body?.prompt;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ message: "Prompt must be a non-empty string" });
    }

    isRegenerating = true;

    try {
      await buildPage({ forceRegenerate: true, nextPrompt: prompt });
      res.status(200).json({ message: "Regenerated with updated prompt" });
    } catch (error) {
      console.error(" Failed to regenerate website with updated prompt", error);
      res.status(500).json({ message: "Failed to regenerate with updated prompt" });
    } finally {
      isRegenerating = false;
    }
  });

  app.listen(3000, () => {
    console.log(" Server running at http://localhost:3000");
  });
}
