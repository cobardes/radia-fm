import { SessionMetadata, SessionQueue, TalkSegment } from "@/types";
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  WithFieldValue,
} from "firebase-admin/firestore";
import db from "./firestore";

const converter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: WithFieldValue<T>): DocumentData => data as DocumentData,
  fromFirestore: (snap: QueryDocumentSnapshot): T => snap.data() as T,
});

const dataPoint = <T extends DocumentData>(collectionPath: string) =>
  db.collection(collectionPath).withConverter(converter<T>());

export const sessions = dataPoint<SessionMetadata>("sessions");
export const queues = dataPoint<SessionQueue>("sessionQueues");
export const talkSegments = dataPoint<TalkSegment>("talkSegments");
