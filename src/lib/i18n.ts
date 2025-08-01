import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Translation resources
export const resources = {
  en: {
    translation: {
      // Main page
      tuneIn: "Tune in",
      debugMode: "Debug mode",

      // Placeholders for search input
      placeholders: [
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
      ],

      // Legacy page
      searchSongTitle: "Let's start by searching for a song:",
      selectLanguage: "Select Language:",
      searchPlaceholder: "Type in and press ENTER",
      searching: "Searching...",
      creatingStation: "Creating station...",
      recentStations: "Recent Stations",
      loadingRecentStations: "Loading recent stations...",
      noRecentStations: "No recent stations found",
      created: "Created",

      // Station page
      stationNotFound: "Station not found",

      // Player controls
      playThisStation: "Play this station",
      resume: "Resume",
      pause: "Pause",
      skip: "Skip",

      // Now playing
      djCommentary: "DJ Commentary",
      buffering: "Buffering",

      // Layout
      experimental: "experimental",
    },
  },
  es: {
    translation: {
      // Main page
      tuneIn: "Sintonizar",
      debugMode: "Modo debug",

      // Placeholders for search input
      placeholders: [
        "grunge súper depresivo de los 90",
        "reggaetón chileno top ahora mismo",
        "producido por ludwig göransson",
        "top 100 canciones de 2025",
        "una canción sobre el amor",
        "shoegaze soñador con reverb",
        "techno melódico para noches tardías",
        "punk británico de los 80",
        "canciones en películas de sofia coppola",
        "indie sleaze",
        "canciones sobre el océano",
      ],

      // Legacy page
      searchSongTitle: "Empecemos buscando una canción:",
      selectLanguage: "Seleccionar idioma:",
      searchPlaceholder: "Escribe y presiona ENTER",
      searching: "Buscando...",
      creatingStation: "Creando estación...",
      recentStations: "Estaciones recientes",
      loadingRecentStations: "Cargando estaciones recientes...",
      noRecentStations: "No se encontraron estaciones recientes",
      created: "Creada",

      // Station page
      stationNotFound: "Estación no encontrada",

      // Player controls
      playThisStation: "Reproducir esta estación",
      resume: "Reanudar",
      pause: "Pausar",
      skip: "Saltar",

      // Now playing
      djCommentary: "Comentario del DJ",
      buffering: "Cargando",

      // Layout
      experimental: "experimental",
    },
  },
};

// Initialize i18n only on client side
if (typeof window !== "undefined") {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      debug: process.env.NODE_ENV === "development",

      interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
      },

      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    });
}

export default i18n;
