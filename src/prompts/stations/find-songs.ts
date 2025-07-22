import { PromptTemplate } from "@langchain/core/prompts";

export const findSongsPromptTemplate =
  PromptTemplate.fromTemplate(/* markdown */ `

You are building an interactive playlist. These are the songs that have played so far, and why they were selected:

{playlist}

## Context

In this scenario, you are doing a "deep dive". This means you are focusing on the discography and influences of *{artist}*. Aim for a 60/40 split between songs by *{artist}* and songs by other artists, interweaving them. Introduce 2 or 3 deep cuts into the mix. Choose songs that were made by or are concretely related to the band in some way.

## Objective

Search the internet to find {count} good songs to follow up, and thoroughly explain each choice in a single paragraph about 200 words long. Include interesting facts when relevant. Use diverse criteria such as artists and producers involved, genres, decades, influences, etc. Investigate what blogs and critics had to say about the music when it was released and in the present. Prioritize history, influences, critical reception and artists over the lyrical conent of the songs. 

## Notes

- Make a selection where each song flows in some way with the next.
- Do not mention "closing" the playlist or segment. This is just one batch of songs. We will continue to add more songs.
- Do not write any introductions or conclusions. Only do song + reasoning combos.
`);
