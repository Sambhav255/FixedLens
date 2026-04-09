import type { ReactNode } from "react";

/** Shared section label for Portfolio / Scenario / Results panels. */
export function PanelSectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "#a3a3a3",
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}
