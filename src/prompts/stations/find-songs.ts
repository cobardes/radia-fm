import { PromptTemplate } from "@langchain/core/prompts";

export const findSongsPromptTemplate =
  PromptTemplate.fromTemplate(/* markdown */ `
## Context

You are building an interactive playlist. These are the songs that have played so far, and why they were selected:

{playlist}

## Your Objective

Search the internet to find {count} good songs to follow up, and thoroughly explain each choice in a single paragraph about 200 words long.

Include interesting facts. Use diverse criteria such as artists and producers involved, genres, decades, influences, lyrics, etc. Investigate what blogs and critics had to say about the music when it was released and in the present.

## Follow these guidelines to find songs:

{guidelines}

## Notes

- CHECK THE GUIDELINES and think carefully about the songs you select, ensuring that they are good additions to the playlist, considering the guidelines you were given.
- DO NOT ASSUME you must fulfill the request within the {count} selected songs. More songs will be added later.
- Make a selection where each song flows in some way with the next.
- Do not mention you are making a "segment" or "closing" the playlist. This is just one batch of songs. We will continue to add more songs.
- Do not write any introductions or conclusions in your response. Only do song + reasoning combos.
`);
