import { generateHTML } from "../services/aiService.js";
import { readFile } from "../utils/fileReader.js";
import { getFileHash, getCachedHTML, saveCache, deleteCachedHTML } from "../utils/cache.js";
import { injectRegenerateControls } from "./injectControls.js";

export function createPageBuilder({ filePath, initialPrompt }) {
  const basePrompt = initialPrompt;
  let additionalPrompt = "";
  let currentHash = null;
  let currentHTML = null;

  function getEffectivePrompt() {
    if (!additionalPrompt.trim()) {
      return basePrompt;
    }

    return `${basePrompt}\n\nAdditional user requirements:\n${additionalPrompt}\n\nApply the base instructions and also satisfy these additional requirements.`;
  }

  async function buildPage({ forceRegenerate = false, nextPrompt = null } = {}) {
    if (typeof nextPrompt === "string") {
      additionalPrompt = nextPrompt.trim();
    }

    const effectivePrompt = getEffectivePrompt();

    const content = readFile(filePath);
    const nextHash = getFileHash(`${effectivePrompt}\n::\n${content}`);

    if (!forceRegenerate) {
      const cached = getCachedHTML(nextHash);

      if (cached) {
        currentHash = nextHash;
        currentHTML = injectRegenerateControls(cached);
        console.log(" Using cached website");
        return;
      }
    }

    if (forceRegenerate && currentHash) {
      deleteCachedHTML(currentHash);
      console.log(" Deleted existing cache");
    }

    console.log(" Generating website using AI...");
  const generatedHTML = await generateHTML(content, effectivePrompt);

    saveCache(nextHash, generatedHTML);

    currentHash = nextHash;
    currentHTML = injectRegenerateControls(generatedHTML);
    console.log(" Saved new cache");
  }

  function getPrompt() {
    return additionalPrompt;
  }

  function getHTML() {
    return currentHTML;
  }

  return {
    buildPage,
    getPrompt,
    getHTML,
  };
}
