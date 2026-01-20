import { auth } from "@/auth";
import HeaderComponent from "@/components/ui/HeaderComponent";
import HeaderTitle from "@/components/ui/HeaderTitle";
import { Button } from "antd";

export default async function Home() {
  const session = await auth();

  return (
    <section>
      <HeaderComponent>
        <HeaderTitle title="Хяналтын самбар" />
        <Button>Here</Button>
      </HeaderComponent>

      <div>Welcome to Next.js {session?.user?.email || "Guest"}!</div>
    </section>
  );
}
