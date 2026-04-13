import axios from "axios";
import dotenv from "dotenv";
import { systemPrompt } from "../prompts/articlePrompt.js";

dotenv.config();

export async function generateHTML(content) {
  const response = await axios.post(
    "https://router.huggingface.co/v1/chat/completions",
    {
      model: "deepseek-ai/DeepSeek-V3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.choices[0].message.content;
}
