import {
  QueueItem,
  RadioSession,
  SessionMetadata,
  SessionQueue,
  Song,
} from "@/types";
import { randomUUID } from "crypto";
import db from "../clients/firestore";

const SESSIONS_COLLECTION = "sessions";
const SESSION_QUEUES_COLLECTION = "sessionQueues";

export class SessionService {
  private getSessionRef(sessionId: string) {
    return db.collection(SESSIONS_COLLECTION).doc(sessionId);
  }

  private getSessionQueueRef(sessionId: string) {
    return db.collection(SESSION_QUEUES_COLLECTION).doc(sessionId);
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

    // Create session metadata
    const sessionMetadata: SessionMetadata = {
      id: sessionId,
      createdAt: now,
      lastActivity: now,
      seedSong,
      currentIndex: -1,
    };

    // Create session queue
    const sessionQueue: SessionQueue = {
      sessionId,
      queue: initialQueue,
      lastUpdated: now,
    };

    // Write to both collections atomically
    await db.runTransaction(async (transaction) => {
      transaction.set(this.getSessionRef(sessionId), sessionMetadata);
      transaction.set(this.getSessionQueueRef(sessionId), sessionQueue);
    });

    // Return combined session for backward compatibility
    const session: RadioSession = {
      ...sessionMetadata,
      queue: initialQueue,
    };

    return session;
  }

  async getSession(sessionId: string): Promise<RadioSession | null> {
    try {
      const [sessionDoc, queueDoc] = await Promise.all([
        this.getSessionRef(sessionId).get(),
        this.getSessionQueueRef(sessionId).get(),
      ]);

      if (!sessionDoc.exists || !queueDoc.exists) {
        return null;
      }

      const sessionMetadata = sessionDoc.data() as SessionMetadata;
      const sessionQueue = queueDoc.data() as SessionQueue;

      // Update last activity
      const now = new Date().toISOString();
      await this.getSessionRef(sessionId).update({
        lastActivity: now,
      });

      // Return combined session
      return {
        ...sessionMetadata,
        lastActivity: now,
        queue: sessionQueue.queue,
      };
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  async updateSession(
    sessionId: string,
    updates: Partial<RadioSession>
  ): Promise<RadioSession | null> {
    try {
      const now = new Date().toISOString();

      await db.runTransaction(async (transaction) => {
        const [sessionDoc, queueDoc] = await Promise.all([
          transaction.get(this.getSessionRef(sessionId)),
          transaction.get(this.getSessionQueueRef(sessionId)),
        ]);

        if (!sessionDoc.exists || !queueDoc.exists) {
          throw new Error("Session not found");
        }

        // Separate queue updates from metadata updates
        const { queue, ...metadataUpdates } = updates;

        // Update metadata if there are metadata changes
        if (Object.keys(metadataUpdates).length > 0) {
          transaction.update(this.getSessionRef(sessionId), {
            ...metadataUpdates,
            lastActivity: now,
          });
        }

        // Update queue if provided
        if (queue) {
          transaction.update(this.getSessionQueueRef(sessionId), {
            queue,
            lastUpdated: now,
          });
        }
      });

      // Return the updated session
      return await this.getSession(sessionId);
    } catch (error) {
      if (error instanceof Error && error.message === "Session not found") {
        return null;
      }
      throw error;
    }
  }

  async updateQueue(
    sessionId: string,
    queue: QueueItem[]
  ): Promise<RadioSession | null> {
    try {
      const now = new Date().toISOString();

      await db.runTransaction(async (transaction) => {
        const queueDoc = await transaction.get(
          this.getSessionQueueRef(sessionId)
        );

        if (!queueDoc.exists) {
          throw new Error("Session not found");
        }

        transaction.update(this.getSessionQueueRef(sessionId), {
          queue,
          lastUpdated: now,
        });
      });

      return await this.getSession(sessionId);
    } catch (error) {
      if (error instanceof Error && error.message === "Session not found") {
        return null;
      }
      throw error;
    }
  }

  async updateCurrentIndex(
    sessionId: string,
    currentIndex: number
  ): Promise<RadioSession | null> {
    return this.updateSession(sessionId, { currentIndex });
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await db.runTransaction(async (transaction) => {
        transaction.delete(this.getSessionRef(sessionId));
        transaction.delete(this.getSessionQueueRef(sessionId));
      });
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      return false;
    }
  }

  // New method to get only queue data (for client-side access)
  async getSessionQueue(sessionId: string): Promise<SessionQueue | null> {
    try {
      const queueDoc = await this.getSessionQueueRef(sessionId).get();

      if (!queueDoc.exists) {
        return null;
      }

      return queueDoc.data() as SessionQueue;
    } catch (error) {
      console.error("Error getting session queue:", error);
      return null;
    }
  }
}

export const sessionService = new SessionService();
