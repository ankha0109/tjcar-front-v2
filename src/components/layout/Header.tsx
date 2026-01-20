import Image from "next/image";
import Link from "next/link";
import { Button } from "antd";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo/logo.svg"
              alt="Next Starter Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Next Starter
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Эхлэл
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Бидний тухай
          </Link>
          <Link
            href="/services"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Үйлчилгээ
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Холбоо барих
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button type="text" className="hidden sm:inline-flex">
              Нэвтрэх
            </Button>
          </Link>
          <Button type="primary" className="bg-blue-600 hover:bg-blue-700">
            Бүртгүүлэх
          </Button>
        </div>
      </div>
    </header>
  );
}
