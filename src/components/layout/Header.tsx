"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "antd";
import { useSession, signOut } from "next-auth/react";

type CustomerUser = {
  firstname: string;
  lastname: string;
  balance: number;
  currency: string;
};

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user as CustomerUser | undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo/logo.svg"
              alt="Next Starter Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-gray-900">
              Next Starter
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Generator
          </Link>
          <Link
            href="/explore"
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/docs"
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {user?.firstname} {user?.lastname}
                </span>
                <span className="text-xs text-gray-500">
                  {user?.balance} {user?.currency}
                </span>
              </div>
              <Button type="text" onClick={() => signOut({ callbackUrl: "/" })}>
                Гарах
              </Button>
            </>
          ) : (
            <Link href="/auth/login">
              <Button type="primary">Нэвтрэх</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
