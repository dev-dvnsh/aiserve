export function injectRegenerateControls(html) {
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
        const editedPrompt = window.prompt(
          "Add extra requirements (leave empty to clear extras)",
          payload.prompt || ""
        );

        if (editedPrompt === null) {
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
