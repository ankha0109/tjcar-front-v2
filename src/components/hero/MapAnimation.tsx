"use client";

import Lottie from "lottie-react";
import animationData from "./mongolia-truck.json";

export default function MapAnimation() {
  return (
    <div className="w-full max-w-7xl mx-auto aspect-12/5">
      <Lottie animationData={animationData} loop autoplay />
    </div>
  );
}
