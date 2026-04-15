import express from "express";
import { systemPrompt } from "../prompts/articlePrompt.js";
import { createPageBuilder } from "./pageBuilder.js";

export async function startServer(filePath) {
  const app = express();
  app.use(express.json());

  const pageBuilder = createPageBuilder({
    filePath,
    initialPrompt: systemPrompt,
  });

  let isRegenerating = false;

  await pageBuilder.buildPage();

  app.get("/", (req, res) => {
    res.send(pageBuilder.getHTML());
  });

  app.post("/regenerate", async (req, res) => {
    if (isRegenerating) {
      return res.status(409).json({ message: "Regeneration already in progress" });
    }

    isRegenerating = true;

    try {
      await pageBuilder.buildPage({ forceRegenerate: true });
      res.status(200).json({ message: "Regenerated" });
    } catch (error) {
      console.error(" Failed to regenerate website", error);
      res.status(500).json({ message: "Failed to regenerate" });
    } finally {
      isRegenerating = false;
    }
  });

  app.get("/current-prompt", (req, res) => {
    res.status(200).json({ prompt: pageBuilder.getPrompt() });
  });

  app.post("/regenerate-with-prompt", async (req, res) => {
    if (isRegenerating) {
      return res.status(409).json({ message: "Regeneration already in progress" });
    }

    const prompt = req.body?.prompt;

    if (typeof prompt !== "string") {
      return res.status(400).json({ message: "Prompt must be a string" });
    }

    isRegenerating = true;

    try {
      await pageBuilder.buildPage({ forceRegenerate: true, nextPrompt: prompt });
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
