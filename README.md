## radia-fm

### How it works

- When you input a query, it creates a station in your Firestore database
- Then, it uses Gemini 2.5 Flash with search grounding to turn your query into "guidelines"
- The guidelines are used to find songs (Gemini 2.5 Pro with grounding)
- Songs are stored in your station's `playlist`
- Then, "talk segments" are generated one by one using GPT-4.1
- The generated texts are stored in a `speeches` collection
- As the playback goes, the `queue` field is populated with what will actually be played on the client (songs + segments)
- Finally, two endpoints (`/api/playback/mp3` and `/api/playback/segment`) stream songs and talk segments to the client
- Voice generation is done on demand, using ElevenLabs and Gemini (for es-CL), when hitting the endpoint.
- Audio files are cached in the filesystem and aggressive caching header are sent in the response.

### Requisites

- A `firebase-service-account.json` file or equivalent
- All the env vars in `.env.example` (Langsmith optional)
- A RapidAPI key and a subscription to [YouTube to MP3](https://rapidapi.com/ezmp3/api/youtube-to-mp337)
- Lots of money to waste on ElevenLabs

### How to run

Easy as pie:

```
npm install
npm run dev
```

### To-do

[ ] In-station query box. Play something else but "merging" with your current guidelines
[ ] Web Audio API playback control. No more of that `<audio>` tag chaos
[ ] Using three.js for visualization, with native post processing instead of CSS filters

### A real product

Some ideas on how this could become an actual thing that people can visit, download and enjoy

- **Port this to Apple MusicKit instead of using shady YouTube MP3s.** Probably the most important thing. It seems like Apple Music is the only service that would allow for the experience we're looking for, in a completely legal way that is also monetizable. (How tf is DailyTube compliant with YouTube's policies?)
- Find a suitable alternative to ElevenLabs, which is just way too expensive for this to be used by a wider audience. Chatterbox seems promising but more research is needed
- Build our own grounding system to stop depending on Google search. It feels like cheating, it is expensive, it has constraints. (It's crazy fast though). We could have an agent - or a network of agents, that scrape wikipedia, last.fm, musicboard, rate your music, music blogs, etc. to make good, informed, interesting (and maybe even subjective!) recommendations. Using SERPs shouldn't be out of the question IMO.
- A "credits" system? Which is just basically tokens
- Making a mobile app with Expo.
