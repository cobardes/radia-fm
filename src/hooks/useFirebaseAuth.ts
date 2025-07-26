"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { useEffect, useState } from "react";

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Sign in anonymously if no user and not loading
    if (!user && !loading) {
      signInAnonymously(auth).catch((error) => {
        console.error("Error signing in anonymously:", error);
      });
    }
  }, [user, loading]);

  return { user, loading };
};
