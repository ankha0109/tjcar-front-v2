"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button, Form, Input, App } from "antd";

type LoginFormValues = {
  phone: string;
  password: string;
};

const LoginFormContent = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        phone: values.phone,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        message.error("Утасны дугаар эсвэл нууц үг буруу байна.");
      } else {
        const callbackUrl = searchParams.get("callbackUrl") || "/";
        router.push(callbackUrl);
      }
    } catch (error) {
      console.log("Login error:", error);
      message.error("Нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Нэвтрэх</h1>
          <p className="text-gray-500 mt-1">
            Системд нэвтрэхийн тулд мэдээллээ оруулна уу
          </p>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            label="Утасны дугаар"
            name="phone"
            rules={[{ required: true, message: "Утасны дугаар оруулна уу" }]}
          >
            <Input size="large" placeholder="Утасны дугаар оруулна уу" />
          </Form.Item>

          <Form.Item
            label="Нууц үг"
            name="password"
            rules={[{ required: true, message: "Нууц үг оруулна уу" }]}
          >
            <Input.Password size="large" placeholder="Нууц үгээ оруулна уу" />
          </Form.Item>

          <Form.Item className="mt-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Нэвтрэх
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginFormContent;
