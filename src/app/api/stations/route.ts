import { createStation } from "@/server/actions/stations/create-station";
import { BaseErrorResponse, Song } from "@/types";
import { StationLanguage } from "@/types/station";
import { NextRequest, NextResponse } from "next/server";

export interface CreateStationRequest {
  seedSong: Song;
  language: StationLanguage;
}

export interface CreateStationSuccessResponse {
  stationId: string;
}

export type CreateStationErrorResponse = BaseErrorResponse;

// Union type for all possible responses from this endpoint
export type CreateStationResponse =
  | CreateStationSuccessResponse
  | BaseErrorResponse;

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
