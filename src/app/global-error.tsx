"use client";

export default function GlobalError({
  error: _error,
  reset: _reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            minHeight: "100vh",
            width: "100%",
            flexDirection: "column",
            backgroundColor: "black"
          }}
        >
          <img
            alt="Space background"
            src="/assets/images/background/dead_screen.png"
            style={{
              pointerEvents: "none",
              position: "absolute",
              left: "50%",
              top: "50%",
              height: "100%",
              width: "100%",
              transform: "translate(-50%, -50%)",
              objectFit: "cover"
            }}
          />

          <div style={{ position: "absolute", left: 18, top: 16 }}>
            <img
              alt="Mago"
              src="/logo.svg"
              style={{ height: 35, width: 119, objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              zIndex: 10,
              display: "flex",
              flex: 1,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 16px"
            }}
          >
            <h1
              style={{
                maxWidth: 600,
                textAlign: "center",
                fontFamily: "Syne, sans-serif",
                fontSize: 24,
                lineHeight: "44px",
                letterSpacing: "-0.4px",
                color: "white",
                margin: 0
              }}
            >
              Something went wrong! Our rescue team is on the way
            </h1>

            <button
              onClick={handleGoHome}
              style={{
                marginTop: 32,
                height: 48,
                cursor: "pointer",
                borderRadius: 6,
                backgroundColor: "rgba(51, 42, 245, 1)",
                padding: "8px 16px",
                color: "white",
                border: "none",
                fontSize: 14
              }}
            >
              Send me home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
