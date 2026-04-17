"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import animationData from "./mongolia-truck.json";

export default function MapAnimation() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto aspect-12/5">
      <Lottie
        animationData={animationData}
        loop={!reduceMotion}
        autoplay={!reduceMotion}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
