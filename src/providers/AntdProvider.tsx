"use client";

import { useState } from "react";
import { App, ConfigProvider, message, theme as antdTheme } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import GuideModalRoot from "@/components/modal/GuideModalRoot";
import mn_MN from "antd/locale/mn_MN";
import en_US from "antd/locale/en_US";
import ru_RU from "antd/locale/ru_RU";
import "dayjs/locale/mn";
import "dayjs/locale/en";
import "dayjs/locale/ru";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { StyleProvider } from "@ant-design/cssinjs";
import type { Theme } from "@/lib/theme";
import { AiChatProvider } from "@/components/ai-chat/AiChatContext";

type AntdProviderProps = {
  children?: React.ReactNode;
  session?: Session | null;
  locale?: string;
  theme?: Theme;
};

const ANTD_LOCALES: Record<string, typeof mn_MN> = {
  mn: mn_MN,
  en: en_US,
  ru: ru_RU,
};

const DAYJS_LOCALES: Record<string, string> = {
  mn: "mn",
  en: "en",
  ru: "ru",
};

const AntdProvider: React.FC<AntdProviderProps> = ({
  children,
  session,
  locale = "mn",
  theme = "light",
}) => {
  const [, contextHolder] = message.useMessage();

  dayjs.locale(DAYJS_LOCALES[locale] ?? "en");

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );

  const isDark = theme === "dark";

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <StyleProvider layer>
          <ConfigProvider
            locale={ANTD_LOCALES[locale] ?? en_US}
            theme={{
              algorithm: isDark
                ? antdTheme.darkAlgorithm
                : antdTheme.defaultAlgorithm,
              token: {
                fontFamily: "Inter, sans-serif",
                colorPrimary: "#F1472C",
                // Black "solid default" button: <Button color="default" variant="solid">.
                // Light: pure black + black/80 hover. Dark: leave antd's darkAlgorithm
                // defaults, which invert colorBgSolid to near-white with dark text so the
                // button stays visible on the dark background (hardcoding #000 here hid it).
                ...(isDark
                  ? {}
                  : {
                      colorBgSolid: "#000000",
                      colorBgSolidHover: "rgba(0, 0, 0, 0.8)",
                      colorBgSolidActive: "rgba(0, 0, 0, 0.9)",
                    }),
                // colorLink: isDark ? "#e8e8ea" : "#ffffff",
                // colorLinkHover: isDark ? "#ffffff" : "#000",
              },
              components: {
                Button: {
                  primaryShadow: "none",
                  defaultShadow: "none",
                  dangerShadow: "none",
                },
              },
            }}
          >
            <App className="w-full mx-auto min-h-screen flex flex-col">
              {contextHolder}
              <AiChatProvider>{children}</AiChatProvider>
              <GuideModalRoot />
            </App>
          </ConfigProvider>
        </StyleProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default AntdProvider;
