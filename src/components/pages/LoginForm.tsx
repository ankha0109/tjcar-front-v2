"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button, Form, Input, App } from "antd";

type LoginFormValues = {
  phone: string;
  password: string;
};

const LoginFormContent = () => {
  const t = useTranslations("auth.login");
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
        message.error(t("errorInvalid"));
      } else {
        const callbackUrl = searchParams.get("callbackUrl") || "/";
        router.push(callbackUrl);
      }
    } catch (error) {
      console.log("Login error:", error);
      message.error(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-gray-500 mt-1">
            {t("subtitle")}
          </p>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            label={t("phoneLabel")}
            name="phone"
            rules={[{ required: true, message: t("phoneRequired") }]}
          >
            <Input size="large" placeholder={t("phonePlaceholder")} />
          </Form.Item>

          <Form.Item
            label={t("passwordLabel")}
            name="password"
            rules={[{ required: true, message: t("passwordRequired") }]}
          >
            <Input.Password size="large" placeholder={t("passwordPlaceholder")} />
          </Form.Item>

          <Form.Item className="mt-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              {t("submit")}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginFormContent;
