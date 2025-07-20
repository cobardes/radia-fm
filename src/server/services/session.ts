import { QueueItem, RadioSession, Song } from "@/types";
import { randomUUID } from "crypto";
import redis from "../clients/redis";

const SESSION_TTL = 14400; // 4 hours in seconds

export class SessionService {
  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  async createSession(seedSong: Song): Promise<RadioSession> {
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    // Create initial queue with greeting and seed song
    const speechUrl = `/api/generate-greeting?trackTitle=${seedSong.title}&trackArtist=${seedSong.artists[0]}`;
    const songUrl = `/api/songs/playback/${seedSong.videoId}`;

    const initialQueue: QueueItem[] = [
      {
        type: "segment",
        id: "greeting-" + Math.random().toString(36).substring(2, 15),
        title: "DJ Greeting",
        audioUrl: speechUrl,
      },
      {
        type: "song",
        id: seedSong.id,
        title: seedSong.title,
        artists: seedSong.artists,
        thumbnail: seedSong.thumbnail,
        audioUrl: songUrl,
      },
    ];

    const session: RadioSession = {
      id: sessionId,
      createdAt: now,
      lastActivity: now,
      seedSong,
      currentIndex: -1,
      queue: initialQueue,
    };

    await redis.setex(
      this.getSessionKey(sessionId),
      SESSION_TTL,
      JSON.stringify(session)
    );

    return session;
  }

  async getSession(sessionId: string): Promise<RadioSession | null> {
    const session = (await redis.get(
      this.getSessionKey(sessionId)
    )) as RadioSession | null;

    if (!session) {
      return null;
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();

    await redis.setex(
      this.getSessionKey(sessionId),
      SESSION_TTL,
      JSON.stringify(session)
    );

    return session;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<RadioSession>
  ): Promise<RadioSession | null> {
    const existing = await this.getSession(sessionId);

    if (!existing) {
      return null;
    }

    const updated: RadioSession = {
      ...existing,
      ...updates,
      lastActivity: new Date().toISOString(),
    };

    await redis.setex(
      this.getSessionKey(sessionId),
      SESSION_TTL,
      JSON.stringify(updated)
    );

    return updated;
  }

  async updateQueue(
    sessionId: string,
    queue: QueueItem[]
  ): Promise<RadioSession | null> {
    return this.updateSession(sessionId, { queue });
  }

  async updateCurrentIndex(
    sessionId: string,
    currentIndex: number
  ): Promise<RadioSession | null> {
    return this.updateSession(sessionId, { currentIndex });
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await redis.del(this.getSessionKey(sessionId));
    return result === 1;
  }
}

export const sessionService = new SessionService();
