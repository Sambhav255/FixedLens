import { useState, type ReactNode } from "react";

interface CollapsiblePanelProps {
  title: string;
  /** Second line on mobile (<768px) accordion — current state summary. */
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  /** Desktop: no border/radius so panel (e.g. portfolio) sits flush on --bg-app; sticky works. */
  bareOnDesktop?: boolean;
  /** Classes on the wrapper around children (e.g. fill grid height + flex column). */
  contentClassName?: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 text-[var(--text-secondary)] interactive-transition"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Accordion section for narrow viewports; full panels on md+. */
export function CollapsiblePanel({
  title,
  summary,
  defaultOpen = true,
  children,
  className = "",
  bareOnDesktop = false,
  contentClassName = "",
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  const shellClass = bareOnDesktop
    ? `overflow-x-hidden overflow-y-visible md:overflow-visible rounded-lg border md:rounded-none md:border-0 ${className}`
    : `overflow-hidden rounded-lg border md:rounded-lg md:border ${className}`;

  return (
    <div
      className={shellClass}
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="accordion-header interactive-surface interactive-transition flex w-full items-center justify-between gap-3 px-4 py-3 text-left md:hidden"
        style={{
          background: "var(--bg-surface)",
          transition: "all 0.15s ease",
        }}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#a3a3a3]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {title}
          </div>
          {summary != null && summary !== "" ? (
            <div
              className="financial-num mt-1 truncate text-[12px] font-medium text-[var(--text-secondary)]"
            >
              {summary}
            </div>
          ) : null}
        </div>
        <ChevronIcon open={open} />
      </button>
      <div
        className={`${open ? "block" : "hidden md:block"} ${contentClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
