import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { isGeminiPlaceholderOutput } from "../lib/gemini";

type TabId = "client" | "advisor";
type CopySlot = "mobile" | "client" | "advisor";

interface AIOutputSectionProps {
  clientLetter: string | null;
  advisorBrief: string | null;
  loading: boolean;
  error: string | null;
  disabled: boolean;
  onRetry: () => void;
  embeddedInMobileAccordion?: boolean;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function advisorBriefToHtml(text: string): string {
  const esc = escapeHtml(text);
  return esc.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

const AI_CONTENT_CARD: CSSProperties = {
  background: "#f9f9f8",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 8,
  padding: "18px 20px",
  minHeight: 180,
};

export function AIOutputSection({
  clientLetter,
  advisorBrief,
  loading,
  error,
  disabled,
  onRetry,
  embeddedInMobileAccordion = false,
}: AIOutputSectionProps) {
  const [tab, setTab] = useState<TabId>("client");
  const [copySlot, setCopySlot] = useState<CopySlot | null>(null);
  const [copyStatusMessage, setCopyStatusMessage] = useState("");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyAnnounceClearRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (copyAnnounceClearRef.current) {
        clearTimeout(copyAnnounceClearRef.current);
      }
    };
  }, []);

  const showCopied = useCallback((slot: CopySlot) => {
    setCopySlot(slot);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopySlot(null);
      copyTimerRef.current = null;
    }, 2000);
  }, []);

  const copyText = useCallback(
    async (slot: CopySlot, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showCopied(slot);
        const msg =
          slot === "client"
            ? "Client letter copied to clipboard."
            : slot === "advisor"
              ? "Advisor brief copied to clipboard."
              : "Copied to clipboard.";
        setCopyStatusMessage(msg);
        if (copyAnnounceClearRef.current) {
          clearTimeout(copyAnnounceClearRef.current);
        }
        copyAnnounceClearRef.current = setTimeout(() => {
          setCopyStatusMessage("");
          copyAnnounceClearRef.current = null;
        }, 1500);
      } catch {
        setCopyStatusMessage("Copy failed. Try again or copy manually.");
        if (copyAnnounceClearRef.current) {
          clearTimeout(copyAnnounceClearRef.current);
        }
        copyAnnounceClearRef.current = setTimeout(() => {
          setCopyStatusMessage("");
          copyAnnounceClearRef.current = null;
        }, 2500);
      }
    },
    [showCopied]
  );

  const isNoApiKeyMessage = isGeminiPlaceholderOutput(advisorBrief);
  const hasRealAnalysis = Boolean(
    clientLetter &&
      advisorBrief &&
      clientLetter.length > 0 &&
      advisorBrief.length > 0 &&
      !isNoApiKeyMessage
  );

  return (
    <section
      className={embeddedInMobileAccordion ? "max-md:border-t-0" : ""}
      aria-busy={loading}
      style={{
        width: "100%",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        background: "#ffffff",
        padding: "24px 24px 36px",
      }}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {copyStatusMessage}
      </p>
      <div
        className="mb-[18px] flex w-full items-center justify-between"
        style={{ marginBottom: 18 }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <h2
            className={`shrink-0 ${embeddedInMobileAccordion ? "max-md:hidden" : ""}`}
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#a3a3a3",
              margin: 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            AI Analysis
          </h2>
          {loading ? (
            <span
              className="ai-status-dot--loading inline-block shrink-0 rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "#6d28d9",
              }}
              aria-hidden
            />
          ) : null}
          {error && !loading ? (
            <span
              className="inline-block shrink-0 rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "#c21b17",
              }}
              aria-hidden
            />
          ) : null}
        </div>

        <div className="hidden md:block" aria-hidden />
      </div>

      {!disabled && !loading && !error && hasRealAnalysis ? (
        <div className="mb-4 md:hidden">
          <div
            className="flex justify-center"
            style={{
              background: "#f5f5f3",
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 20,
              padding: 3,
              gap: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setTab("client")}
              className="tab-btn border-none"
              style={{
                padding: "5px 14px",
                borderRadius: 18,
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                ...(tab === "client"
                  ? {
                      background: "#ffffff",
                      color: "#0a0a0a",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
                    }
                  : { background: "transparent", color: "#a3a3a3" }),
              }}
            >
              Client Letter
            </button>
            <button
              type="button"
              onClick={() => setTab("advisor")}
              className="tab-btn border-none"
              style={{
                padding: "5px 14px",
                borderRadius: 18,
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                ...(tab === "advisor"
                  ? {
                      background: "#ffffff",
                      color: "#0a0a0a",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
                    }
                  : { background: "transparent", color: "#a3a3a3" }),
              }}
            >
              Advisor Brief
            </button>
          </div>
        </div>
      ) : null}

      {disabled && !loading && !error ? (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 100 }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "#c4c4c4",
              textAlign: "center",
            }}
          >
            Build your portfolio and select a scenario to generate AI analysis
          </p>
        </div>
      ) : null}

      {!disabled && !loading && !error && isNoApiKeyMessage ? (
        <div
          className="flex justify-center"
          style={{
            background: "#eff4ff",
            border: "1px solid rgba(15,98,254,0.15)",
            borderRadius: 8,
            padding: "16px 20px",
            maxWidth: 720,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#525252",
              textAlign: "center",
            }}
          >
            AI analysis requires a Gemini API key. Add VITE_GEMINI_API_KEY to
            your .env.local file to enable client letters and advisor briefs.
            All calculations above are fully functional.
          </p>
        </div>
      ) : null}

      {error && !loading ? (
        <div
          className="flex flex-col items-center text-center"
          role="alert"
          style={{
            background: "#fff8ee",
            border: "1px solid rgba(180,83,9,0.15)",
            borderRadius: 8,
            padding: 20,
          }}
        >
          <IconWarningTriangle />
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 500,
              color: "#b45309",
              marginTop: 8,
            }}
          >
            Analysis couldn&apos;t be generated
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: "#a3a3a3",
              marginTop: 4,
              maxWidth: 400,
              lineHeight: 1.5,
            }}
          >
            This is usually a temporary issue. Your calculated results above are
            unaffected.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="retry-btn copy-btn"
            aria-label="Retry AI analysis"
            style={{
              marginTop: 12,
              border: "1px solid rgba(180,83,9,0.25)",
              background: "transparent",
              borderRadius: 5,
              padding: "5px 14px",
              fontSize: 12,
              color: "#b45309",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(180,83,9,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
          style={{ gap: 20 }}
        >
          <ColumnShimmer />
          <ColumnShimmer />
        </div>
      ) : null}

      {!loading && !error && hasRealAnalysis ? (
        <>
          <div
            className="hidden gap-5 md:grid md:grid-cols-2"
            style={{ gap: 20 }}
          >
            <OutputColumn
              headerLabel="FOR YOUR CLIENT"
              copyAriaLabel="Copy client letter"
              bodyColor="#525252"
              disclaimer="Review before sending · AI-generated draft"
              text={clientLetter!}
              copySlot={copySlot}
              onCopy={() => copyText("client", clientLetter!)}
              copyKey="client"
              parseBold={false}
            />
            <OutputColumn
              headerLabel="YOUR ANALYSIS"
              copyAriaLabel="Copy advisor brief"
              bodyColor="#0a0a0a"
              text={advisorBrief!}
              copySlot={copySlot}
              onCopy={() => copyText("advisor", advisorBrief!)}
              copyKey="advisor"
              parseBold
            />
          </div>

          <div className="md:hidden">
            {tab === "client" ? (
              <OutputColumn
                headerLabel="FOR YOUR CLIENT"
                copyAriaLabel="Copy client letter"
                bodyColor="#525252"
                disclaimer="Review before sending · AI-generated draft"
                text={clientLetter!}
                copySlot={copySlot}
                onCopy={() => copyText("client", clientLetter!)}
                copyKey="client"
                parseBold={false}
              />
            ) : (
              <OutputColumn
                headerLabel="YOUR ANALYSIS"
                copyAriaLabel="Copy advisor brief"
                bodyColor="#0a0a0a"
                text={advisorBrief!}
                copySlot={copySlot}
                onCopy={() => copyText("advisor", advisorBrief!)}
                copyKey="advisor"
                parseBold
              />
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ColumnShimmer() {
  const widths = ["100%", "88%", "100%", "72%"];
  return (
    <div
      className="flex flex-col gap-2.5"
      style={{ ...AI_CONTENT_CARD, minHeight: 180 }}
    >
      {widths.map((w, i) => (
        <div key={i} className="ai-col-shimmer-line" style={{ width: w }} />
      ))}
    </div>
  );
}

function OutputColumn({
  headerLabel,
  copyAriaLabel,
  bodyColor,
  disclaimer,
  parseBold,
  text,
  copySlot,
  onCopy,
  copyKey,
}: {
  headerLabel: string;
  copyAriaLabel: string;
  bodyColor: string;
  disclaimer?: string;
  parseBold?: boolean;
  text: string;
  copySlot: CopySlot | null;
  onCopy: () => void;
  copyKey: CopySlot;
}) {
  const copied = copySlot === copyKey;
  const advisorHtml = parseBold ? advisorBriefToHtml(text) : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#a3a3a3",
            fontFamily: "var(--font-sans)",
          }}
        >
          {headerLabel}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="copy-btn shrink-0"
          aria-label={copied ? `${copyAriaLabel} — copied` : copyAriaLabel}
          style={{
            border: "1px solid rgba(0,0,0,0.10)",
            background: "transparent",
            borderRadius: 5,
            padding: "3px 9px",
            fontSize: 11,
            cursor: "pointer",
            color: copied ? "#0a7153" : "#a3a3a3",
            borderColor: copied ? "rgba(10,113,83,0.35)" : "rgba(0,0,0,0.10)",
            fontFamily: "var(--font-sans)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)";
              e.currentTarget.style.color = "#525252";
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.10)";
              e.currentTarget.style.color = "#a3a3a3";
            }
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <div style={AI_CONTENT_CARD}>
        {parseBold && advisorHtml != null ? (
          <div
            className="whitespace-pre-wrap"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              lineHeight: 1.75,
              color: bodyColor,
            }}
            dangerouslySetInnerHTML={{ __html: advisorHtml }}
          />
        ) : (
          <p
            className="whitespace-pre-wrap"
            style={{
              margin: 0,
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              lineHeight: 1.75,
              color: bodyColor,
            }}
          >
            {text}
          </p>
        )}
      </div>
      {disclaimer ? (
        <p
          style={{
            marginTop: 8,
            fontSize: 10,
            color: "#a3a3a3",
            fontFamily: "var(--font-sans)",
          }}
        >
          {disclaimer}
        </p>
      ) : null}
    </div>
  );
}

function IconWarningTriangle() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 3L2 21h20L12 3z"
        stroke="#b45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v5M12 17h.01"
        stroke="#b45309"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
