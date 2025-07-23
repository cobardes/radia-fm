import { Station } from "@/types/station";
import { useQuery } from "@tanstack/react-query";

interface RecentStationsResponse {
  stations: Station[];
}

const fetchRecentStations = async (): Promise<Station[]> => {
  const response = await fetch("/api/stations");

  if (!response.ok) {
    throw new Error("Failed to fetch recent stations");
  }

  const data: RecentStationsResponse = await response.json();
  return data.stations;
};

export const useRecentStations = () => {
  return useQuery({
    queryKey: ["recent-stations"],
    queryFn: fetchRecentStations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
