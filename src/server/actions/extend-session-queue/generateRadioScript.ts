import { langsmithClient } from "@/lib/langsmith";
import { generateScriptPrompt } from "@/prompts";
import { RadioScript, SessionPlaylistItem, radioScriptSchema } from "@/types";
import { formatPlaylistAsString } from "@/utils";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { traceable } from "langsmith/traceable";

const _generateRadioScript = async (
  newPlaylistItems: SessionPlaylistItem[],
  language: string,
  sessionId: string
): Promise<RadioScript> => {
  const log = (message: string) => {
    console.log(`[SID:${sessionId.slice(0, 8)}] ${message}`);
  };

  log(`Generating script...`);

  const scriptDraft = await generateObject({
    model: openai("gpt-4.1"),
    prompt: generateScriptPrompt({
      playlist: formatPlaylistAsString(newPlaylistItems, true),
      language,
    }),
    schema: radioScriptSchema,
    experimental_telemetry: {
      isEnabled: true,
      metadata: {
        ls_run_name: "generate-radio-script",
        sessionId: sessionId.slice(0, 8),
        language,
        playlistSize: newPlaylistItems.length.toString(),
      },
    },
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
};

export const generateRadioScript = traceable(_generateRadioScript, {
  name: "generate-radio-script",
  client: langsmithClient,
});
