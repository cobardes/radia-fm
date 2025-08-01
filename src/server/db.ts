import { Speech } from "@/types";
import { Station } from "@/types/station";
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

export const stations = dataPoint<Station>("stations");
export const speeches = dataPoint<Speech>("speeches");
