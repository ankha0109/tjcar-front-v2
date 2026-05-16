"use client";

import { useSyncExternalStore } from "react";
import Lottie from "lottie-react";
import animationData from "./mongolia-truck.json";

const MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(MEDIA_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(MEDIA_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export default function MapAnimation() {
  const reduceMotion = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

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
