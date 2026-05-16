import { Suspense } from "react";
import LoginFormContent from "@/components/pages/LoginForm";

export const metadata = {
  title: "Нэвтрэх",
  description: "Нэвтрэх хуудас",
};

const Login = () => {
  return (
    <Suspense fallback={null}>
      <LoginFormContent />
    </Suspense>
  );
};

export default Login;
