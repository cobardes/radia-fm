import { generateScriptPrompt } from "@/prompts";
import { RadioScript, SessionPlaylistItem, radioScriptSchema } from "@/types";
import { formatPlaylistAsString } from "@/utils";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export async function generateRadioScript(
  newPlaylistItems: SessionPlaylistItem[],
  language: string,
  sessionId: string
): Promise<RadioScript> {
  const log = (message: string) => {
    console.log(`[SID:${sessionId.slice(0, 8)}] ${message}`);
  };

  log(`Generating script...`);

  const scriptDraft = await generateObject({
    model: google("gemini-2.5-pro"),
    prompt: generateScriptPrompt({
      playlist: formatPlaylistAsString(newPlaylistItems, true),
      language,
    }),
    schema: radioScriptSchema,
  });

  console.log(JSON.stringify(scriptDraft.object, null, 2));

  log(`Generated script with ${scriptDraft.object.script.length} items`);

  log(
    `Songs in the script: ${scriptDraft.object.script
      .filter((item) => item.type === "song")
      .map((item) => item.title)
      .join(", ")}`
  );

  return scriptDraft.object;
}
