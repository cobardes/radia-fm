import { readFileSync } from "fs";
import { join } from "path";

/**
 * Load a prompt template from the prompts folder and replace variables
 * @param promptName - Name of the prompt file (without .md extension)
 * @param variables - Object containing key-value pairs for variable replacement
 * @returns The processed prompt with variables replaced
 */
export function loadPrompt(
  promptName: string,
  variables: Record<string, string> = {}
): string {
  // Load the prompt template
  const promptPath = join(process.cwd(), "src", "prompts", `${promptName}.md`);
  const promptTemplate = readFileSync(promptPath, "utf-8");

  // Replace all variables in the template
  let processedPrompt = promptTemplate;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{${key}\\}`, "g");
    processedPrompt = processedPrompt.replace(placeholder, value);
  });

  return processedPrompt;
}
