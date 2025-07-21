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
  template: string
): (variables: Record<T, string>) => string {
  return (variables: Record<T, string>) => {
    return fillPrompt(template, variables);
  };
}
