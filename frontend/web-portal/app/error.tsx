"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App runtime error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "#fff",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: 32,
        maxWidth: 640,
        width: "100%",
      }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 12 }}>
          ZAI-CTS — Error Recovered
        </h1>
        <p style={{ marginBottom: 16, opacity: 0.9 }}>
          A runtime error occurred, but the app prevented a blank screen.
        </p>
        <p style={{ marginBottom: 24, opacity: 0.7, fontSize: "0.875rem" }}>
          {error.message || "Unknown error"}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              padding: "12px 24px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              padding: "12px 24px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
