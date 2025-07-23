import { createStation } from "@/server/actions/stations/create-station";
import { stations } from "@/server/db";
import { BaseErrorResponse, Song } from "@/types";
import { Station, StationLanguage } from "@/types/station";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

export interface CreateStationRequest {
  seedSong: Song;
  language: StationLanguage;
}

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
    const body: CreateStationRequest = await request.json();

    if (!body.seedSong || !body.seedSong.id) {
      return NextResponse.json(
        { error: "Valid seedSong is required" } as BaseErrorResponse,
        { status: 400 }
      );
    }

    const stationId = await createStation(body.seedSong, body.language);

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
