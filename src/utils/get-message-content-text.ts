import {
  type MessageContent,
  MessageContentText,
} from "@langchain/core/messages";

export function getMessageContentText(content: MessageContent): string {
  if (typeof content === "string") {
    return content;
  }

  return (
    (
      content.findLast(
        (content) => content.type === "text"
      ) as MessageContentText
    )?.text ?? ""
  );
}
