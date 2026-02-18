"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body>
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Что-то пошло не так</h2>
          <p style={{ color: "#666", marginBottom: "1rem" }}>{error.message}</p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              cursor: "pointer",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
