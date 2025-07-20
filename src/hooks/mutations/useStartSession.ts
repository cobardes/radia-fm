import {
  SessionStartErrorResponse,
  SessionStartRequest,
  SessionStartSuccessResponse,
} from "@/app/api/sessions/start/route";
import { useMutation } from "@tanstack/react-query";

const startSession = async (
  sessionRequest: SessionStartRequest
): Promise<SessionStartSuccessResponse> => {
  const response = await fetch("/api/sessions/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sessionRequest),
  });

  const data = await response.json();

  if (!response.ok) {
    // Type the error response
    const errorResponse = data as SessionStartErrorResponse;
    throw new Error(errorResponse.error || "Failed to create session");
  }

  return data as SessionStartSuccessResponse;
};

export const useStartSessionMutation = () => {
  return useMutation({
    mutationFn: startSession,
  });
};
