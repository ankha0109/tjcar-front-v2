"use client";

import { Button, ConfigProvider } from "antd";
import type { ButtonProps } from "antd";

const BRAND_ORANGE = "#F1472C";

/**
 * Antd Button rendered with the TJ Car brand orange instead of the global
 * black primary. Use anywhere a CTA needs to read as the brand color
 * (e.g. HeroFilter submit, key marketing buttons).
 *
 * Drop-in for `<Button type="primary">`. All Antd ButtonProps pass through.
 */
export default function BrandButton(props: ButtonProps) {
  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: BRAND_ORANGE },
      }}
    >
      <Button type="primary" {...props} />
    </ConfigProvider>
  );
}
