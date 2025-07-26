"use client";

import {
  CreateStationErrorResponse,
  CreateStationRequest,
  CreateStationSuccessResponse,
} from "@/app/api/stations/route";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useMutation } from "@tanstack/react-query";

const createStation = async (
  createStationRequest: CreateStationRequest,
  userToken: string
): Promise<CreateStationSuccessResponse> => {
  const response = await fetch("/api/stations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify(createStationRequest),
  });

  const data = await response.json();

  if (!response.ok) {
    // Type the error response
    const errorResponse = data as CreateStationErrorResponse;
    throw new Error(errorResponse.error || "Failed to create station");
  }

  return data as CreateStationSuccessResponse;
};

export const useCreateStationMutation = () => {
  const { user } = useFirebaseAuth();

  return useMutation({
    mutationFn: async (createStationRequest: CreateStationRequest) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const token = await user.getIdToken();
      return createStation(createStationRequest, token);
    },
  });
};
