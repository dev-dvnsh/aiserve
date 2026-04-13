import express from "express";
import { generateHTML } from "../services/aiService.js";
import { readFile } from "../utils/fileReader.js";

export async function startServer(filePath) {
  const app = express();

  const content = readFile(filePath);
  const html = await generateHTML(content);

  app.get("/", (req, res) => {
    res.send(html);
  });

  app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
  });
}
