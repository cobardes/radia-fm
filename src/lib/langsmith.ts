import { Client } from "langsmith";
import { initializeOTEL } from "langsmith/experimental/otel/setup";

// Initialize OTEL for Langsmith tracing
const { DEFAULT_LANGSMITH_SPAN_PROCESSOR } = initializeOTEL();

// Create a shared LangSmith client instance
export const langsmithClient = new Client();

// Export the span processor for shutdown handling
export { DEFAULT_LANGSMITH_SPAN_PROCESSOR };
