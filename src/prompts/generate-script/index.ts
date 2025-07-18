import { createPrompt } from "@/utils";

type Variables = "playlist" | "language";

export const generateScriptPrompt = createPrompt<Variables>("generate-script");
