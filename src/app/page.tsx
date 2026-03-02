import { auth } from "@/auth";
import FeaturedCard from "@/components/cards/FeaturedCard";
import ServerApi from "@/services/ServerApi";
import { FeaturedCar } from "@/types/featured";

async function getFeaturedCars(accessToken: string): Promise<FeaturedCar[]> {
  console.log("accessToken:", accessToken);
  const api = ServerApi(accessToken);
  return api.get("/featured", {}, { next: { revalidate: 60 } } as RequestInit);
}

export default async function Home() {
  const session = await auth();
  const cars = session?.accessToken
    ? await getFeaturedCars(session.accessToken)
    : [];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Онцлох машинууд
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cars.map((car) => (
          <FeaturedCard key={car.ID} car={car} />
        ))}
      </div>
    </div>
  );
}
