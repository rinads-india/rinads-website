import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type FilmProps = { vertical: boolean };
type SceneProps = FilmProps & { children: ReactNode; duration: number };

const COLORS = {
  background: "#08060D",
  surface: "#1A1025",
  panel: "#21152E",
  purple: "#A858D7",
  pale: "#F1DBFF",
  muted: "#B5A7BE",
  white: "#FFFFFF",
} as const;

const stages = [
  { from: 0, duration: 7 * 30 },
  { from: 7 * 30, duration: 8 * 30 },
  { from: 15 * 30, duration: 10 * 30 },
  { from: 25 * 30, duration: 11 * 30 },
  { from: 36 * 30, duration: 9 * 30 },
] as const;

function Scene({ vertical, children, duration }: SceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 15, duration - 20, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const up = spring({ fps, frame, config: { damping: 200 } });
  const scale = interpolate(up, [0, 1], [0.96, 1]);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: vertical ? 78 : 120,
        opacity,
        transform: `scale(${scale})`,
        textAlign: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function Heading({ eyebrow, title, body, vertical }: { eyebrow: string; title: string; body: string; vertical: boolean }) {
  return (
    <div style={{ maxWidth: vertical ? 900 : 1350 }}>
      <div style={{ color: COLORS.purple, fontSize: vertical ? 30 : 26, letterSpacing: 5, fontWeight: 700 }}>
        {eyebrow.toUpperCase()}
      </div>
      <div style={{ marginTop: 32, color: COLORS.white, fontSize: vertical ? 84 : 86, lineHeight: 1.09, letterSpacing: -3, fontWeight: 800 }}>
        {title}
      </div>
      <div style={{ marginTop: 30, color: COLORS.muted, fontSize: vertical ? 36 : 33, lineHeight: 1.35 }}>
        {body}
      </div>
    </div>
  );
}

function Token({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    background: COLORS.surface,
    border: "2px solid rgba(168,88,215,0.36)",
    borderRadius: 24,
    padding: "22px 35px",
    fontSize: 31,
    fontWeight: 650,
    color: COLORS.pale,
  };
  return <div style={style}>{children}</div>;
}

export function BusinessSimplifiedFilm({ vertical }: FilmProps) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 75% 26%, rgba(115,43,159,0.26), transparent 50%), ${COLORS.background}`,
        color: COLORS.white,
        fontFamily: "Inter, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill style={{ opacity: 0.12, backgroundImage: "linear-gradient(#7A35A0 1px, transparent 1px), linear-gradient(90deg, #7A35A0 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      <Sequence from={stages[0].from} durationInFrames={stages[0].duration}>
        <Scene vertical={vertical} duration={stages[0].duration}>
          <Heading eyebrow="The problem" title="Business shouldn't feel this complicated." body="Disconnected customers, tasks, payments and follow-ups." vertical={vertical} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: 60 }}>
            <Token>Customers</Token><Token>Orders</Token><Token>Payments</Token><Token>Tasks</Token>
          </div>
        </Scene>
      </Sequence>
      <Sequence from={stages[1].from} durationInFrames={stages[1].duration}>
        <Scene vertical={vertical} duration={stages[1].duration}>
          <Heading eyebrow="Meet RINADS" title="One connected experience." body="RUN · SELL · GROW · AUTOMATE" vertical={vertical} />
          <div style={{ marginTop: 58, borderRadius: 32, background: COLORS.panel, border: "2px solid rgba(168,88,215,0.45)", padding: 30, width: vertical ? 850 : 1120, maxWidth: "100%", fontSize: vertical ? 34 : 28 }}>
            Business priorities in one clear view
          </div>
        </Scene>
      </Sequence>
      <Sequence from={stages[2].from} durationInFrames={stages[2].duration}>
        <Scene vertical={vertical} duration={stages[2].duration}>
          <Heading eyebrow="Meet RINPO" title="Ask your business anything." body="RINPO is the interface. RINADS INTELLIGENCE helps you understand." vertical={vertical} />
          <div style={{ marginTop: 60, border: "3px solid rgba(168,88,215,0.55)", background: COLORS.panel, borderRadius: 42, padding: 36, width: vertical ? 760 : 900, maxWidth: "100%" }}>
            <div style={{ fontSize: 28, color: COLORS.pale, fontWeight: 750 }}>RINPO PHONE · ILLUSTRATIVE DEMO</div>
            <div style={{ fontSize: 36, marginTop: 20 }}>“What needs my attention today?”</div>
          </div>
        </Scene>
      </Sequence>
      <Sequence from={stages[3].from} durationInFrames={stages[3].duration}>
        <Scene vertical={vertical} duration={stages[3].duration}>
          <Heading eyebrow="Intelligence to action" title="Understand. Approve. Act." body="RINPO RUNTIME executes permitted actions with approvals and audit." vertical={vertical} />
          <div style={{ marginTop: 65, display: "flex", flexDirection: vertical ? "column" : "row", gap: 20, alignItems: "center" }}>
            <Token>01 · Recommend</Token><Token>02 · Authorize</Token><Token>03 · Audit</Token>
          </div>
          <div style={{ marginTop: 36, fontSize: 24, color: COLORS.muted }}>Illustrative workflow — no customer actions performed</div>
        </Scene>
      </Sequence>
      <Sequence from={stages[4].from} durationInFrames={stages[4].duration}>
        <Scene vertical={vertical} duration={stages[4].duration}>
          <div style={{ color: COLORS.pale, fontWeight: 850, fontSize: vertical ? 150 : 160, letterSpacing: -7 }}>RINADS</div>
          <div style={{ color: COLORS.white, fontSize: vertical ? 76 : 83, fontWeight: 700, marginTop: 24 }}>Business, simplified.</div>
          <div style={{ color: COLORS.muted, fontSize: 30, marginTop: 35 }}>Powered by RINADS INTELLIGENCE · Executed by RINPO RUNTIME</div>
          <div style={{ color: COLORS.purple, fontSize: 28, marginTop: 45 }}>www.rinads.com</div>
        </Scene>
      </Sequence>
      <div style={{ position: "absolute", bottom: vertical ? 65 : 40, left: 0, right: 0, textAlign: "center", color: COLORS.muted, fontSize: 21 }}>
        Concept film · Contains illustrative, not live business results
      </div>
    </AbsoluteFill>
  );
}
