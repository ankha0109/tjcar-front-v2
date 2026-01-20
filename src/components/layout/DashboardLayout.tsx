"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Button, Avatar, Dropdown, Badge, theme } from "antd";
import { signOut } from "next-auth/react";

const { Header, Sider, Content } = Layout;

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Sidebar цэсний жагсаалт
  const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "Нүүр хуудас",
      onClick: () => router.push("/"),
    },
    {
      key: "/profile",
      icon: <UserOutlined />,
      label: "Профайл",
      onClick: () => router.push("/profile"),
    },
    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "Тохиргоо",
      onClick: () => router.push("/settings"),
    },
  ];

  // Logout функц
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Хэрэглэгчийн dropdown цэс
  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Профайл",
      onClick: () => router.push("/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Тохиргоо",
      onClick: () => router.push("/settings"),
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Гарах",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo */}
        <div className="h-16 m-4 flex items-center justify-center">
          <div className="text-white text-xl font-bold">
            {collapsed ? "L" : "LOGO"}
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
        />
      </Sider>

      {/* Main Layout */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        {/* Header */}
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Toggle Button */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Badge count={5}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: "18px" }} />}
                onClick={() => {
                  // Notification логик
                }}
              />
            </Badge>

            {/* User Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar
                  style={{ backgroundColor: "#1890ff" }}
                  icon={<UserOutlined />}
                />
                {!collapsed && <span className="font-medium">Хэрэглэгч</span>}
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
