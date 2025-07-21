"use client";

import RadioPlayer from "@/components/RadioPlayer";
import { useRealtimeQueue } from "@/hooks/useRealtimeQueue";
import Link from "next/link";
import { useParams } from "next/navigation";
import ScaleLoader from "react-spinners/ScaleLoader";

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  // Real-time session queue data
  const {
    queue,
    extending,
    loading: queueLoading,
    error: queueError,
  } = useRealtimeQueue(sessionId);

  const handleExtend = async () => {
    await fetch(`/api/sessions/extend/${sessionId}`, {
      method: "POST",
    });
  };

  if (queueError) {
    return (
      <div className="font-sans p-8">
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
          <div className="text-red-500 text-center">
            Error loading session: {queueError}
          </div>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 text-center underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans p-8">
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
        {/* Header with session info and navigation */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="text-blue-500 hover:text-blue-600 text-sm underline"
            >
              ← Start New Session
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Your Radio Session</h1>
            <div className="text-sm text-gray-500">
              Session: {sessionId.slice(0, 8)}...
            </div>
          </div>
        </div>

        {/* Loading state */}
        {queueLoading && (
          <div className="flex justify-center items-center gap-2">
            <ScaleLoader color="#000" />
            <div>Loading your playlist...</div>
          </div>
        )}

        {extending ? (
          <div className="flex justify-center items-center gap-2">
            <ScaleLoader color="#000" />
            <div>Extending your playlist...</div>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={handleExtend}
              className="text-blue-500 hover:text-blue-600 text-sm underline"
            >
              Extend your playlist
            </button>
          </div>
        )}

        {/* Radio Player */}
        {!queueLoading && queue.length > 0 && <RadioPlayer queue={queue} />}

        {/* Empty state */}
        {!queueLoading && queue.length === 0 && (
          <div className="text-center text-gray-500">
            <p>No songs in this session yet.</p>
            <Link
              href="/"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Create a new session
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
