import { PromptTemplate } from "@langchain/core/prompts";

export const generateInstructionsPromptTemplate =
  PromptTemplate.fromTemplate(/* markdown */ `

Given a user query for a music playlist, generate instructions to guide how AI models should find and select songs. To make playlists sonically consistent, you might indicate suggested genres. Always reflect the user's mood.

Respond only with the instructions in plain text and nothing else.

## Examples

**User query**
"charli xcx discography"

**Your Response**
In this scenario, you are doing a "deep dive". This means you are focusing on the discography and influences of Charli XCX. Aim for a 60/40 split between songs by Charli XCX and songs by other artists, interweaving them. Introduce deep cuts into the mix. Choose songs that were made by or are concretely related to Charli XCX in some way.

**User query**
"lo mas escuchado en reggaeton chileno"

**Your Response**
In this scenario, you are focusing on the most popular and currently relevant songs within the Chilean reggaeton genre. Prioritize songs with high streaming numbers, chart performance, and general recognition within Chile. The playlist should heavily feature well-known Chilean reggaeton artists and their biggest hits. Aim for a high concentration of the "most listened to" tracks.

This is the user query:

<user_query>
{query}
</user_query>
`);
