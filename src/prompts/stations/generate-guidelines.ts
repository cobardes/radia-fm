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

Then, select 1 song to begin the playlist according to the guidelines. Include the song's title, artist, and a summary about the song and why you selected it.

**CRITICAL:** Always search the web to resolve this request.

## Notes
- If the user's query is about a specific song, the playlist MUST start with that song.
- If the user's query is about a specific artist, the playlist MUST start with a song by that artist.
- If the user asks for songs that are "top", "hot", or uses terms like "hits", "actuales", "current", "right now" etc. you MUST prioritize **recently released** songs, meaning within the last 3 months.

## Examples

**Example query**
"charli xcx deep dive"

**Example Response**
\`\`\`
## Guidelines
In this scenario, you are doing a "deep dive". This means you are focusing on the discography and influences of Charli XCX. Aim for a 60/40 split between songs by Charli XCX and songs by other artists, interweaving them. Introduce deep cuts into the mix. Choose songs that were made by or are concretely related to Charli XCX in some way. REMEMBER to enforce the ratio of songs by Charli XCX to other artists.

## Initial song

Title: "Take My Hand"
Artist: "Charli XCX"
Kicking off this deep dive into the sonic world of Charli XCX is "Take My Hand," a standout deep cut from her 2013 debut album, *True Romance*. This track serves as a perfect entry point, not because it was a chart-topping single, but because it so perfectly encapsulates the essence of Charli's early artistic identity. Produced by the acclaimed Ariel Rechtshaid, who has also worked with the likes of Vampire Weekend and Haim, "Take My Hand" is a masterclass in moody synth-pop. The song is characterized by its grandiose, soaring production and a hazy, dreamlike atmosphere that feels both enchanting and escapist. It’s a sound that defined *True Romance*, an album that, while not a massive commercial success, was lauded by critics for its forward-thinking approach to pop music. Charli herself cited a diverse and somewhat unexpected range of influences for the album, including the 80s pop of Martika, the gothic rock of The Cure, and the bubblegum pop of Britney Spears. This eclectic mix is palpable in "Take My Hand," with its shimmering synths, melancholic undertones, and undeniable pop sensibility. The track showcases the early signs of Charli's experimental tendencies, her willingness to play with texture and mood within a pop framework. It's a song that invites the listener into a world of ethereal soundscapes and raw emotion, setting the stage for the genre-bending journey that is to come.
\`\`\`

## User query

<user_query>
{query}
</user_query>

Respond with the guidelines in the Markdown format from the examples.
`);
