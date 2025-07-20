import { SessionErrorResponse } from "@/app/api/sessions/start/route";
import { SessionCreateRequest, SessionResponse } from "@/types";
import { useMutation } from "@tanstack/react-query";

const createSession = async (
  sessionRequest: SessionCreateRequest
): Promise<SessionResponse> => {
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
    const errorResponse = data as SessionErrorResponse;
    throw new Error(errorResponse.error || "Failed to create session");
  }

  return data as SessionResponse;
};

export const useCreateSession = () => {
  return useMutation({
    mutationFn: createSession,
  });
};
