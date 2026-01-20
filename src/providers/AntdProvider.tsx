"use client";

import { StyleProvider } from "@ant-design/cssinjs";
import { App, ConfigProvider, ConfigProviderProps, message } from "antd";
import { useEffect, useMemo } from "react";

import { Colors } from "@/constants/Colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import GuideModalRoot from "@/components/modal/GuideModalRoot";
import mn_MN from "antd/locale/mn_MN";
import "dayjs/locale/mn";
import { SessionProvider, signOut } from "next-auth/react";
import { AuthProvider } from "@/providers/AuthProvider";
import { setCachedSession } from "@/services/Api";
import { Session } from "next-auth";

dayjs.locale("mn");

type AntdProviderProps = {
  children?: React.ReactNode;
  session?: Session | null;
};

const AntdProvider: React.FC<AntdProviderProps> = ({ children, session }) => {
  const [messageApi, contextHolder] = message.useMessage();

  // Set session cache immediately during render (before any effects run)
  // This ensures session is available before child components mount and make API calls
  useMemo(() => {
    if (session) {
      setCachedSession(session);
    }
    return session;
  }, [session]);

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
          <StyleProvider layer>
            <ConfigProvider
              locale={mn_MN}
              theme={{
                token: {
                  fontFamily: "Inter, sans-serif",
                  colorPrimary: "#005FEE",
                  colorError: "#BC1818",
                  colorSuccess: "#18AA0B",
                  colorWarning: "#DF9800",
                  borderRadius: 5,
                  colorText: Colors.text,
                  colorFillSecondary: Colors.water,
                  controlItemBgActive: Colors.water,
                  controlItemBgActiveHover: Colors.water,
                  controlItemBgHover: Colors.water,
                },
                components: {
                  Button: {
                    paddingBlock: 4,
                    paddingInline: 15,
                    defaultHoverBorderColor: "#6A6A6A",
                    defaultHoverColor: "inherit",
                  },
                  Form: {
                    labelColor: "#6A6A6A",
                    verticalLabelPadding: 0,
                  },
                  Input: {
                    hoverBorderColor: "#B4B4B4",
                    activeBorderColor: "#6A6A6A",
                    activeShadow: "none",
                  },
                  Segmented: {
                    itemActiveBg: "transparent",
                    itemHoverBg: "transparent",
                    itemSelectedBg: Colors.primary,
                    itemSelectedColor: "white",
                    itemColor: "#B4B4B4",
                    trackBg: "transparent",
                    trackPadding: 3,
                  },
                  Tabs: {
                    horizontalItemGutter: 15,
                    horizontalItemPadding: "5px 5px",
                    itemColor: "#6A6A6A",
                  },
                  Table: {
                    headerBg: "#ffffff",
                    headerColor: "#6A6A6A",
                    fontWeightStrong: 400,
                    cellPaddingBlock: 11,
                    cellPaddingInline: 10,
                    borderColor: "rgba(106, 106, 106,0.2)",
                    headerSplitColor: "transparent",
                  },
                  Modal: {
                    titleFontSize: 18,
                    fontWeightStrong: 400,
                  },
                  // Dropdown: {
                  //   padding: 0,
                  //   paddingXXS: 0,
                  //   controlPaddingHorizontal: 15,
                  //   paddingBlock: 5,
                  //   borderRadiusSM: 0,
                  //   colorPrimary: "#222222",
                  //   controlItemBgActive: "#E6EFFD",
                  // },
                  Select: {
                    controlPaddingHorizontal: 15,
                    // padding: 0,
                    paddingContentHorizontal: 0,
                    hoverBorderColor: "#B4B4B4",
                    activeBorderColor: "#6A6A6A",
                    boxShadow: "none",
                  },
                  Slider: {
                    trackBg: Colors.primary,
                    handleColor: Colors.primary,
                  },
                  Cascader: {
                    // optionPadding: 0,
                    padding: 0,
                    menuPadding: 0,
                    controlItemWidth: 180,
                  },
                  Upload: {
                    controlItemBgHover: "transparent",
                  },
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
      </AuthProvider>
    </SessionProvider>
  );
};

export default AntdProvider;
