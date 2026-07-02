import HeroV2 from "./HeroV2";
import ServiceShowcase from "./ServiceShowcase";

/**
 * Home page — version 2 (demo).
 * Bespoke route-motif hero followed by the interactive service showcase.
 */
export default function HomeV2() {
  return (
    <div className="w-full">
      <HeroV2 />
      <ServiceShowcase />
    </div>
  );
}
