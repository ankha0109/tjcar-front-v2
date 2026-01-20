"use client";

import Image from "next/image";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="max-w-7xl w-full mx-auto min-h-screen flex flex-col">
      <div className="flex flex-column-auto items-center justify-between p-10">
        <div>
          <Image
            src="/images/logo/logo.svg"
            alt="Logo"
            width={180}
            height={140}
            priority
          />
        </div>
      </div>
      {children}
      <div className="d-flex flex-center flex-column-auto p-10 text-gray-500 text-center">
        <p>© {new Date().getFullYear()} Next Starter. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AuthLayout;
