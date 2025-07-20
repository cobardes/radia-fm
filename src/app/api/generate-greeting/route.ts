import generateSpeech from "@/utils/generate-speech";
import { NextRequest, NextResponse } from "next/server";

const greetings = [
  "BESTIE! BESTIE! Are you ready for this emotional damage?! It's {trackTitle} by {trackArtist} and I'm literally SOBBING! *sniff sniff* Why does music hit so different?! UwU",
  "Sksksksk and I oop- welcome to Radius! Y-your song choice is giving me LIFE! {trackTitle} by {trackArtist}? Sir... SIR! This is a Wendy's but also... *chef's kiss* IMMACULATE vibes!",
  "Hewwo there, pwease don't judge me but... {trackTitle} by {trackArtist} just made me question my entire existence! I'm... I'm not okay! BUT WE'RE DOING THIS ANYWAY! *nervous laughter*",
  "RADIUS FAM! Your host is having a whole BREAKDOWN because you chose {trackTitle} by {trackArtist} and it's giving me Vietnam flashbacks to my emo phase! I'M LIVING FOR IT!",
  "*clears throat aggressively* Welcome to- WAIT NO! *voice crack* Welcome to Radius where I, your unhinged DJ, am absolutely FERAL about {trackTitle} by {trackArtist}! Send help!",
  "OH. MY. GOSH. BECKY! Look at this song choice! {trackTitle} by {trackArtist}?! I literally can't breathe! Is this what love feels like?! MOM COME PICK ME UP!",
  "Radius here and I just want you to know that {trackTitle} by {trackArtist} awakened something in me that should have stayed BURIED! But here we are! Living our truth!",
  "W-w-welcome to... *heavy breathing* ...to Radius! I'm your host and I'm having a MOMENT because {trackTitle} by {trackArtist} just ATTACKED my soul! Why am I like this?!",
  "YEET! That's right, I said yeet in 2024! Welcome to Radius where {trackTitle} by {trackArtist} just made me have an out-of-body experience! Is this what enlightenment feels like?!",
  "Listen... LISTEN! I know I'm supposed to be professional but {trackTitle} by {trackArtist} just made me realize I've been living a LIE! This is my villain origin story!",
  "SLAY QUEEN! Wait, that's you! You slayed with {trackTitle} by {trackArtist}! I'm literally DECEASED! Call the coroner because this song just ENDED me! But I'm still talking somehow?!",
  "Radius FM where we overshare! Speaking of which, {trackTitle} by {trackArtist} just reminded me of my ex and now I'm crying in the club! But it's okay because WE'RE THRIVING!",
  "*inhales deeply* AHHHHHHHHHH! Welcome to Radius! {trackTitle} by {trackArtist} just gave me whiplash and now I can taste colors! Is this normal?! PROBABLY NOT!",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackTitle = searchParams.get("trackTitle");
    const trackArtist = searchParams.get("trackArtist");

    if (!trackTitle || !trackArtist) {
      return NextResponse.json(
        { error: "trackTitle and trackArtist are required" },
        { status: 400 }
      );
    }

    // Select a random greeting
    const randomGreeting =
      greetings[Math.floor(Math.random() * greetings.length)];

    // Replace placeholders with actual track info
    const personalizedGreeting = randomGreeting
      .replace("{trackTitle}", trackTitle)
      .replace("{trackArtist}", trackArtist);

    // Generate speech from the prompt
    const mp3Buffer = await generateSpeech(personalizedGreeting);

    // Return the MP3 data as a binary response
    return new NextResponse(mp3Buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": mp3Buffer.length.toString(),
        "Content-Disposition": 'attachment; filename="speech.mp3"',
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
