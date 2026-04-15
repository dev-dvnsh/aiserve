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
<script>
  (function () {
    const button = document.getElementById("aiserve-regenerate-btn");

    if (!button) return;

    button.addEventListener("click", async function () {
      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "Regenerating...";

      try {
        const response = await fetch("/regenerate", { method: "POST" });
        if (!response.ok) throw new Error("Regeneration failed");
        window.location.reload();
      } catch (error) {
        alert("Failed to regenerate page. Check server logs.");
      } finally {
        button.disabled = false;
        button.textContent = originalText;
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

  #aiserve-regenerate-btn:disabled {
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

  let currentHash = null;
  let html = null;
  let isRegenerating = false;

  async function buildPage({ forceRegenerate = false } = {}) {
    const content = readFile(filePath);
    const nextHash = getFileHash(content);

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
    const generatedHTML = await generateHTML(content, systemPrompt);

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

  app.listen(3000, () => {
    console.log(" Server running at http://localhost:3000");
  });
}
