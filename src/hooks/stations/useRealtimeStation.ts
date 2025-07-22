"use client";

import { db } from "@/lib/firebase";
import { Station } from "@/types/station";
import { doc, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

export interface RealtimeStation {
  station: Station | null;
  extend: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useRealtimeStation(stationId: string | null): RealtimeStation {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const extend = useCallback(async () => {
    if (!station) return;
    await fetch(`/api/stations/extend/${station.id}`, {
      method: "POST",
    });
  }, [station]);

  useEffect(() => {
    if (!stationId) {
      setStation(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to real-time queue updates only
    const stationRef = doc(db, "stations", stationId);
    const unsubscribe = onSnapshot(
      stationRef,
      (doc) => {
        if (doc.exists()) {
          const stationData = doc.data() as Station;
          setStation(stationData);
        } else {
          setStation(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Station listener error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount or sessionId change
    return () => unsubscribe();
  }, [stationId]);

  return {
    station,
    extend,
    loading,
    error,
  };
}
