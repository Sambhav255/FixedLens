export function Footer() {
  const linkedIn = import.meta.env.VITE_LINKEDIN_URL?.trim();
  const github = import.meta.env.VITE_GITHUB_URL?.trim();

  return (
    <footer
      className="shrink-0"
      style={{
        background: "#ffffff",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        padding: "14px 24px",
      }}
    >
      <div
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <p
          style={{
            fontSize: 11,
            lineHeight: 1.5,
            color: "#c4c4c4",
            fontFamily: "var(--font-sans)",
            maxWidth: 720,
          }}
        >
          FixedLens uses a modified duration + convexity approximation for
          illustrative purposes. Not investment advice. Asset parameters
          represent approximate 2025–2026 index exposures.
        </p>
        <div
          className="shrink-0 md:text-right"
          style={{
            fontSize: 11,
            color: "#a3a3a3",
            fontFamily: "var(--font-sans)",
          }}
        >
          Built by Sambhav Lamichhane
          {linkedIn ? (
            <>
              {" "}
              ·{" "}
              <a
                href={linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                LinkedIn
              </a>
            </>
          ) : null}
          {github ? (
            <>
              {" "}
              ·{" "}
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                GitHub
              </a>
            </>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
