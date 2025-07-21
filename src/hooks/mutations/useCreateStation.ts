import {
  CreateStationErrorResponse,
  CreateStationRequest,
  CreateStationSuccessResponse,
} from "@/app/api/stations/route";
import { useMutation } from "@tanstack/react-query";

const createStation = async (
  createStationRequest: CreateStationRequest
): Promise<CreateStationSuccessResponse> => {
  const response = await fetch("/api/stations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  return useMutation({
    mutationFn: createStation,
  });
};
