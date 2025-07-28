import { PromptTemplate } from "@langchain/core/prompts";

const information = /* markdown */ `
## Useful information

Date: ${new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
})}
Time: ${new Date().toLocaleTimeString("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})}.
`;

export const generateInstructionsPromptTemplate =
  PromptTemplate.fromTemplate(/* markdown */ `
${information}

## Objective

Given a user query for a music playlist, generate a set of guidlines for AI models to follow when finding and selecting songs. To make playlists sonically consistent, you might indicate suggested genres. Always reflect the user's mood. If the user requests for specific songs or artists, they must be included in the playlist. If the user requests about an album, you must include and prioritize the songs from the album.

**CRITICAL:** If the user's query is about a specific song, the playlist MUST start with that song.

**CRITICAL:** If the user asks for songs that are "top", "hot", or uses terms like "hits", "actuales", "current", "right now" etc. you MUST prioritize **recently released** songs, meaning within the last 3 months.

**NOTE:** Always search the web for context about the user's query.

Respond only with the guidelines in plain text and nothing else.

## Examples

**Example query**
"charli xcx discography"

**Example Response**
In this scenario, you are doing a "deep dive". This means you are focusing on the discography and influences of Charli XCX. Aim for a 60/40 split between songs by Charli XCX and songs by other artists, interweaving them. Introduce deep cuts into the mix. Choose songs that were made by or are concretely related to Charli XCX in some way.

**Example query**
"hits actuales del reggaeton chileno"

**Example Response**
In this scenario, you are focusing on RECENTLY RELEASED (within the last 3 months) songs within the Chilean reggaeton genre, in July 2025. Prioritize songs with high streaming numbers, chart performance, and general recognition within Chile. Aim for a high concentration of the "most listened to" tracks in July 2025, always looking for RECENTLY RELEASED songs.

**Example query**
"interpol and fontaines dc"

**Example Response**
In this scenario, you are creating a playlist that specifically blends the sounds of Interpol and Fontaines D.C. The focus should be on their shared musical characteristics, such as post-punk revival influences, atmospheric tones, and energetic yet often melancholic moods. Aim for a balanced representation of both bands, interweaving their songs throughout the playlist to create a cohesive listening experience. You may include a smaller selection of tracks from other artists that sonically complement Interpol and Fontaines D.C., drawing from genres like post-punk, indie rock, and alternative rock, ensuring they align with the established mood and soundscape.

**Example query**
"roman holiday by nicki minaj and roman holiday by fontaines dc. what connects them?"

**Example Response**
In this scenario, you are creating a playlist that attempts to blend the dissimilar sounds of "Roman Holiday" by Nicki Minaj and "Roman Holiday" by Fontaines D.C. The focus should be on finding a common thread between the two songs, using creativity and a bit of humor. You must include both songs in the playlist. You may jump between genres and artists as long as you keep building a narrative that connects the two songs.

**Example query**
"alambre pua"

**Example Response**
In this scenario, you are creating a playlist based on the query "alambre pua". Given the current date and the significant recent release by Bad Bunny, the primary focus of the playlist should be on the song "ALAMBRE PúA" by Bad Bunny and tracks within the Latin trap and reggaeton genres that match its energetic and contemporary urban Latin sound. Maintain sonic consistency within this genre. You must begin the playlist with the song "ALAMBRE PúA" by Bad Bunny.


## User query

<user_query>
{query}
</user_query>

Respond with the guidelines in plain text and nothing else.
`);
