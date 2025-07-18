import { readFileSync } from "fs";
import { join } from "path";

function loadPromptTemplate(promptName: string): string {
  const promptPath = join(
    process.cwd(),
    "src",
    "prompts",
    promptName,
    "prompt.md"
  );
  const prompt = readFileSync(promptPath, "utf-8");

  return prompt;
}

function fillPrompt<T extends Record<string, string>>(
  template: string,
  variables: T
): string {
  let filledTemplate = template;

  // Replace all variables in the format {variableName} with actual values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    filledTemplate = filledTemplate.replace(regex, value as string);
  }

  return filledTemplate;
}

export function createPrompt<T extends string>(
  promptName: string
): (variables: Record<T, string>) => string {
  const template = loadPromptTemplate(promptName);

  return (variables: Record<T, string>) => {
    return fillPrompt(template, variables);
  };
}
