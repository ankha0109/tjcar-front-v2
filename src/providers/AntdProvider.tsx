"use client";

import { App, ConfigProvider, message } from "antd";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import GuideModalRoot from "@/components/modal/GuideModalRoot";
import mn_MN from "antd/locale/mn_MN";
import "dayjs/locale/mn";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { StyleProvider } from "@ant-design/cssinjs";

dayjs.locale("mn");

type AntdProviderProps = {
  children?: React.ReactNode;
  session?: Session | null;
};

const AntdProvider: React.FC<AntdProviderProps> = ({ children, session }) => {
  const [, contextHolder] = message.useMessage();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <StyleProvider layer>
          <ConfigProvider
            locale={mn_MN}
            theme={{
              token: {
                fontFamily: "Inter, sans-serif",
                colorPrimary: "#F1472C",
                colorLink: "#222",
                colorLinkHover: "#000",
              },
            }}
          >
            <App className="w-full mx-auto min-h-screen flex flex-col">
              {contextHolder}
              {children}
              <GuideModalRoot />
            </App>
          </ConfigProvider>
        </StyleProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default AntdProvider;
