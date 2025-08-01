import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// Timing configuration constants
const TYPING_DELAY = 70; // ms between characters when typing
const PAUSE_AFTER_TYPING = 2000; // ms pause after completing typing
const REMOVING_DELAY = 30; // ms between characters when removing (faster)
const PAUSE_BETWEEN_PLACEHOLDERS = 500; // ms pause before starting next placeholder

// Fallback placeholders if translation fails
const FALLBACK_PLACEHOLDERS = [
  "super depressive 90s grunge",
  "top chilean reggaeton right now",
  "produced by ludwig göransson",
  "top 100 songs of 2025",
  "a song about love",
  "dreamy shoegaze with reverb",
  "melodic techno for late nights",
  "british punk from the 80s",
  "songs in movies by sofia coppola",
  "indie sleaze",
  "songs about the ocean",
];

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useAnimatedPlaceholder() {
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  const { t, i18n } = useTranslation();

  // Get localized placeholders
  const placeholders = useMemo(() => {
    try {
      const translated = t("placeholders", { returnObjects: true });
      return Array.isArray(translated) ? translated : FALLBACK_PLACEHOLDERS;
    } catch {
      return FALLBACK_PLACEHOLDERS;
    }
  }, [t, i18n.language]);

  // Shuffle the array when placeholders change
  const shuffledPlaceholders = useMemo(
    () => shuffleArray(placeholders),
    [placeholders]
  );

  // Reset animation state when placeholders change
  useEffect(() => {
    setCurrentIndex(0);
    setIsTyping(true);
    setCharIndex(0);
    setCurrentPlaceholder("");
  }, [placeholders]);

  useEffect(() => {
    if (shuffledPlaceholders.length === 0) return;

    const currentFullText = shuffledPlaceholders[currentIndex];

    if (isTyping) {
      // Adding characters
      if (charIndex < currentFullText.length) {
        const timeout = setTimeout(() => {
          setCurrentPlaceholder(currentFullText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, TYPING_DELAY);

        return () => clearTimeout(timeout);
      } else {
        // Finished typing, pause before removing
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, PAUSE_AFTER_TYPING);

        return () => clearTimeout(timeout);
      }
    } else {
      // Removing characters
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setCharIndex(charIndex - 1);
          setCurrentPlaceholder(currentFullText.slice(0, charIndex - 1));
        }, REMOVING_DELAY);

        return () => clearTimeout(timeout);
      } else {
        // Finished removing, move to next placeholder
        const timeout = setTimeout(() => {
          setCurrentIndex(
            (prevIndex) => (prevIndex + 1) % shuffledPlaceholders.length
          );
          setIsTyping(true);
          setCharIndex(0);
          setCurrentPlaceholder("");
        }, PAUSE_BETWEEN_PLACEHOLDERS);

        return () => clearTimeout(timeout);
      }
    }
  }, [shuffledPlaceholders, currentIndex, isTyping, charIndex]);

  return currentPlaceholder;
}
