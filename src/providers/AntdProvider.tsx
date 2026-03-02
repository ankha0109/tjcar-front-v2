"use client";

import { App, ConfigProvider, message } from "antd";
import { useEffect } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import GuideModalRoot from "@/components/modal/GuideModalRoot";
import mn_MN from "antd/locale/mn_MN";
import "dayjs/locale/mn";
import { SessionProvider, signOut } from "next-auth/react";
import { AuthProvider } from "@/providers/AuthProvider";
import { Session } from "next-auth";

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

  useEffect(() => {
    const handleTokenExpired = () => {
      signOut();
    };

    window.addEventListener("token_expired", handleTokenExpired);

    return () => {
      window.removeEventListener("token_expired", handleTokenExpired);
    };
  }, []);

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <AuthProvider initialSession={session}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider locale={mn_MN}>
              <App className="w-full mx-auto min-h-screen flex flex-col">
                {contextHolder}
                {children}
                <GuideModalRoot />
              </App>
            </ConfigProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SessionProvider>
  );
};

export default AntdProvider;
