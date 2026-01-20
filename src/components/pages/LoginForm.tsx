"use client";

import { App, Button, Form, Input, Typography } from "antd";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

const { Title } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginFormContent = () => {
  const { modal } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();

  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: searchParams.get("callbackUrl") || "/",
      });
      console.log("result", result);

      if (result?.error) {
        modal.warning({
          title: "Уучлаарай",
          content: "И-мэйл хаяг эсвэл нууц үг буруу байна",
          okText: "Хаах",
          centered: true,
        });
        return;
      }

      if (result?.ok) {
        // Refresh session to update the cached session in AuthProvider
        await refreshSession();
        router.push(result.url || "/");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      modal.error({
        title: "Алдаа гарлаа",
        content: "Нэвтрэх явцад алдаа гарлаа. Дахин оролдоно уу.",
        okText: "Хаах",
        centered: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-auto w-96 mx-auto h-full flex flex-col justify-center">
      <Title level={3} className="mb-10">
        Тавтай морил
      </Title>
      <Form layout="vertical" onFinish={handleLogin} size="large" form={form}>
        <Form.Item
          name="email"
          label="И-мэйл хаяг"
          rules={[
            { required: true, message: "И-мэйл хаяг оруулна уу" },
            { type: "email", message: "И-мэйл хаяг зөв оруулна уу" },
          ]}
        >
          <Input placeholder="И-мэйл хаяг" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Нууц үг"
          labelCol={{ span: 24 }}
          rules={[{ required: true, message: "Нууц үг оруулна уу" }]}
        >
          <Input.Password placeholder="Нууц үг" />
        </Form.Item>
        <div className="text-right">
          <Link href="/auth/forgot-password">Нууц үгээ мартсан уу?</Link>
        </div>
        <Form.Item label=" ">
          <Button type="primary" htmlType="submit" block loading={loading}>
            Нэвтрэх
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginFormContent;
