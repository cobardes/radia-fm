import { createStation } from "@/server/actions/stations/create-station";
import { stations } from "@/server/db";
import { BaseErrorResponse, Song } from "@/types";
import { Station, StationLanguage } from "@/types/station";
import { getAuth } from "firebase-admin/auth";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

export type CreateStationRequest =
  | { type: "song"; seedSong: Song; language: StationLanguage }
  | { type: "query"; query: string; language: StationLanguage };

export interface CreateStationSuccessResponse {
  stationId: string;
}

export type CreateStationErrorResponse = BaseErrorResponse;

export interface RecentStationsResponse {
  stations: Station[];
}

// Union type for all possible responses from this endpoint
export type CreateStationResponse =
  | CreateStationSuccessResponse
  | BaseErrorResponse;

export async function GET(): Promise<
  NextResponse<RecentStationsResponse | BaseErrorResponse>
> {
  try {
    const stationsSnapshot = await stations
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const recentStations: Station[] = [];
    stationsSnapshot.forEach((doc: QueryDocumentSnapshot<Station>) => {
      recentStations.push(doc.data());
    });

    return NextResponse.json({
      stations: recentStations,
    });
  } catch (error) {
    console.error("Error fetching recent stations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent stations" } as BaseErrorResponse,
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateStationResponse>> {
  try {
    // Verify Firebase Auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" } as BaseErrorResponse, {
        status: 401,
      });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const body: CreateStationRequest = await request.json();

    let stationId: string;

    if (body.type === "song") {
      if (!body.seedSong || !body.seedSong.id) {
        return NextResponse.json(
          { error: "Valid seedSong is required" } as BaseErrorResponse,
          { status: 400 }
        );
      }
      stationId = await createStation(body.seedSong, body.language, userId);
    } else if (body.type === "query") {
      if (!body.query || !body.query.trim()) {
        return NextResponse.json(
          { error: "Valid query is required" } as BaseErrorResponse,
          { status: 400 }
        );
      }
      stationId = await createStation(body.query.trim(), body.language, userId);
    } else {
      return NextResponse.json(
        { error: "Invalid request type" } as BaseErrorResponse,
        { status: 400 }
      );
    }

    return NextResponse.json({
      stationId,
    });
  } catch (error) {
    console.error("Error creating station:", error);
    return NextResponse.json(
      { error: "Failed to create station" } as BaseErrorResponse,
      { status: 500 }
    );
  }
}
