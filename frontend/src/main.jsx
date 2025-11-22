import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

/**
 * Production-ready error handling for Chrome extension warnings
 *
 * The "Unchecked runtime.lastError: The message port closed before a response was received"
 * error is a harmless Chrome extension warning that occurs when:
 * 1. A Chrome extension tries to communicate with a content script
 * 2. The page navigates or reloads before the extension gets a response
 * 3. The extension's message port closes unexpectedly
 *
 * This doesn't affect app functionality but can clutter the console.
 * We suppress it in production while keeping it visible in development for debugging.
 */
if (process.env.NODE_ENV === "production") {
  // Only suppress in production
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const errorMessage = args[0]?.toString() || "";
    // Filter out Chrome extension port errors
    if (
      errorMessage.includes("runtime.lastError") ||
      errorMessage.includes("message port closed") ||
      errorMessage.includes("Extension context invalidated")
    ) {
      // Silently ignore these harmless extension errors in production
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const warnMessage = args[0]?.toString() || "";
    // Filter out Chrome extension warnings
    if (
      warnMessage.includes("runtime.lastError") ||
      warnMessage.includes("message port closed") ||
      warnMessage.includes("Extension context invalidated")
    ) {
      // Silently ignore these harmless extension warnings in production
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Global error handler for unhandled errors (production only)
if (process.env.NODE_ENV === "production") {
  window.addEventListener(
    "error",
    (event) => {
      // Suppress Chrome extension errors
      if (
        event.message?.includes("runtime.lastError") ||
        event.message?.includes("message port closed") ||
        event.message?.includes("Extension context invalidated")
      ) {
        event.preventDefault();
        return false;
      }
    },
    true
  ); // Use capture phase

  // Global unhandled promise rejection handler
  window.addEventListener("unhandledrejection", (event) => {
    // Suppress Chrome extension errors
    const reason = event.reason?.message || event.reason?.toString() || "";
    if (
      reason.includes("runtime.lastError") ||
      reason.includes("message port closed") ||
      reason.includes("Extension context invalidated")
    ) {
      event.preventDefault();
      return false;
    }
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
