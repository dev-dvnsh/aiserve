import express from "express";
import { generateHTML } from "../services/aiService.js";
import { readFile } from "../utils/fileReader.js";
import { systemPrompt } from "../prompts/articlePrompt.js";
import { getFileHash, getCachedHTML, saveCache } from "../utils/cache.js";

export async function startServer(filePath) {
  const app = express();

  const content = readFile(filePath);
  const hash = getFileHash(content);

  let html = getCachedHTML(hash);

  if (!html) {
    console.log(" Generating website using AI...");

    html = await generateHTML(content, systemPrompt);

    saveCache(hash, html);
  } else {
    console.log(" Using cached website");
  }

  app.get("/", (req, res) => {
    res.send(html);
  });

  app.listen(3000, () => {
    console.log(" Server running at http://localhost:3000");
  });
}
