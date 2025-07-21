import { talkSegments } from "@/server/db";
import { RadioScript, TalkSegment, TalkSegmentLanguage } from "@/types";
import { randomUUID } from "crypto";

export async function createScriptTalkSegments(
  radioScript: RadioScript,
  language: TalkSegmentLanguage,
  sessionId: string
): Promise<void> {
  const log = (message: string) => {
    console.log(`[SID:${sessionId.slice(0, 8)}] ${message}`);
  };

  // Create talkSegments for each segment in the script
  for (const scriptItem of radioScript.script) {
    if (scriptItem.type === "segment" && scriptItem.text) {
      // Create a new talkSegment in the database
      const segmentId = randomUUID();

      // Use the existing TalkSegment type for better type safety
      const talkSegmentData: TalkSegment = {
        text: scriptItem.text,
        language: language,
      };

      await talkSegments.doc(segmentId).set(talkSegmentData);

      log(`Created talkSegment: ${segmentId}`);

      // Store the segment ID back in the script item for later use
      scriptItem.segmentId = segmentId;
    }
  }
}
