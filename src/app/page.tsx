import Link from "next/link";
import { Button } from "antd";
import {
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Бизнесээ хөгжүүлэх
            <span className="text-blue-600"> шинэ боломж</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Орчин үеийн технологи ашиглан бизнесийн үр ашгийг дээшлүүлж,
            хугацаа хэмнэж, амжилтанд хүрээрэй
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/login">
              <Button type="primary" size="large" className="h-12 px-8 text-lg">
                Эхлэх
              </Button>
            </Link>
            <Link href="#features">
              <Button size="large" className="h-12 px-8 text-lg">
                Дэлгэрэнгүй
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Онцлог боломжууд
            </h2>
            <p className="text-gray-600 text-lg">
              Таны бизнест зориулсан найдвартай шийдлүүд
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <RocketOutlined className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Хурдан</h3>
              <p className="text-gray-600">
                Орчин үеийн технологи ашиглан хурдан, найдвартай үйлчилгээ
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <SafetyOutlined className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Найдвартай</h3>
              <p className="text-gray-600">
                Өндөр түвшний аюулгүй байдал, таны өгөгдөл хамгаалагдсан
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <ThunderboltOutlined className="text-3xl text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Үр ашигтай</h3>
              <p className="text-gray-600">
                Автоматжуулалтаар цаг хугацаа, зардлаа хэмнээрэй
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <TeamOutlined className="text-3xl text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Хамтын ажиллагаа</h3>
              <p className="text-gray-600">
                Багийн ажиллагааг сайжруулж, хамтран ажиллах орчин бүрдүүлэх
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Идэвхтэй хэрэглэгч</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime баталгаа</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Дэмжлэг үйлчилгээ</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">
              Өнөөдөр эхлэхэд бэлэн үү?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Бүртгүүлж, таны бизнесийг дараагийн түвшинд гаргаарай
            </p>
            <Link href="/auth/login">
              <Button
                type="primary"
                size="large"
                className="h-12 px-8 text-lg bg-white text-blue-600 hover:bg-gray-100 border-0"
              >
                Үнэгүй эхлэх
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Бидний тухай</h3>
              <p className="text-sm">
                Бизнесийн орчин үеийн шийдлүүд хөгжүүлэгч компани
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Холбоосууд</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Бүтээгдэхүүн
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Үнэ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Баримт бичиг
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Дэмжлэг</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Тусламж
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Холбоо барих
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Хууль эрх зүй</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Үйлчилгээний нөхцөл
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Нууцлалын бодлого
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Next Starter. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
