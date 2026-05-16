"use client";

import type React from "react";

export interface GuideOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  okText?: string;
  onOk?: () => void | Promise<void>;
  width?: number;
  className?: string;
  afterClose?: () => void;
}

type GuideEventDetail = { options: GuideOptions };

export const GUIDE_CHANNEL = "guide:open";

export function openGuide(options: GuideOptions) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<GuideEventDetail>(GUIDE_CHANNEL, {
      detail: { options },
    })
  );
}
