import { db } from "@/lib/firebase";
import { QueueItem, SessionQueue } from "@/types";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useRealtimeQueue(sessionId: string | null) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setQueue([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to real-time queue updates only
    const sessionQueueRef = doc(db, "sessionQueues", sessionId);
    const unsubscribe = onSnapshot(
      sessionQueueRef,
      (doc) => {
        if (doc.exists()) {
          const sessionQueue = doc.data() as SessionQueue;
          setQueue(sessionQueue.queue);
        } else {
          setQueue([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Session queue listener error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount or sessionId change
    return () => unsubscribe();
  }, [sessionId]);

  return {
    queue,
    loading,
    error,
  };
}
