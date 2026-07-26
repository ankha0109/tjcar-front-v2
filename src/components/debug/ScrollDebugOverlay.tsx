"use client";

/**
 * TEMPORARY diagnostic — delete once the iOS Safari scroll report is resolved.
 *
 * iOS Safari has no console, so this prints the same data on screen: for every
 * route change it records whether the navigation was a push or a history
 * traversal (pop), the scroll trajectory that follows, and the page's scrollable
 * range. Screenshot it from the phone.
 *
 * Off unless the URL carries `?scrolldebug=1`. That sticks in sessionStorage so
 * it survives client-side navigation (which drops the query) and reloads, and
 * dies with the tab. `?scrolldebug=0` turns it back off.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const FLAG = "scrolldebug";
const MAX_LINES = 9;
const SAMPLE_MS = 150;
const WATCH_MS = 3000;

type Line = {
  nav: "PUSH" | "POP" | "LOAD";
  path: string;
  traj: string;
  maxY: number;
};

export default function ScrollDebugOverlay() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  const [env, setEnv] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const isPop = useRef(false);
  const firstRun = useRef(true);

  // ── enable / disable ──
  /* eslint-disable react-hooks/set-state-in-effect --
     sessionStorage and the viewport probe are client-only, so the flag can only
     be resolved after mount. Costs one extra render in a debug-only component. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get(FLAG);
    if (q === "1") sessionStorage.setItem(FLAG, "1");
    if (q === "0") sessionStorage.removeItem(FLAG);
    if (sessionStorage.getItem(FLAG) !== "1") return;
    setOn(true);

    // one-off: the viewport units this device actually reports
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;left:-9999px;width:1px;height:100vh";
    document.body.appendChild(probe);
    const vh = Math.round(probe.getBoundingClientRect().height);
    probe.style.height = "100dvh";
    const dvh = Math.round(probe.getBoundingClientRect().height);
    probe.remove();
    setEnv(`ih=${window.innerHeight} vh=${vh} dvh=${dvh}`);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── push vs history traversal ──
  useEffect(() => {
    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── sample the scroll after every route change ──
  useEffect(() => {
    if (!on) return;
    const nav: Line["nav"] = firstRun.current
      ? "LOAD"
      : isPop.current
        ? "POP"
        : "PUSH";
    firstRun.current = false;
    isPop.current = false;

    const ys: number[] = [];
    const id = window.setInterval(() => {
      ys.push(Math.round(window.scrollY));
    }, SAMPLE_MS);
    const stop = window.setTimeout(() => {
      window.clearInterval(id);
      const traj = ys.filter((v, i) => i === 0 || v !== ys[i - 1]).join("→");
      const maxY = Math.round(
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setLines((prev) =>
        [...prev, { nav, path: pathname, traj: traj || "-", maxY }].slice(
          -MAX_LINES,
        ),
      );
    }, WATCH_MS);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, [on, pathname]);

  if (!on) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] p-1">
      {/* Stays click-through so the bottom nav underneath is still tappable —
          navigating via those tabs is one of the flows being measured. */}
      <div className="rounded-md bg-black/85 px-2 py-1.5 font-mono text-[9px] leading-[1.45] text-lime-300">
        <div className="flex items-center justify-between gap-2 text-white">
          <span>scroll probe · {env}</span>
          <button
            type="button"
            onClick={() => setLines([])}
            className="pointer-events-auto rounded bg-white/20 px-2 py-0.5"
          >
            clear
          </button>
        </div>
        {lines.map((l, i) => {
          const settled = l.traj.split("→").pop();
          const leaked = l.nav === "PUSH" && settled !== "0";
          return (
            <div key={i} className={l.nav === "POP" ? "text-amber-300" : ""}>
              {l.nav} {l.path} · y {l.traj} · max {l.maxY}
              {leaked ? " <<LEAK" : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
