import Image from "next/image";

/**
 * Static landing asset on our own CDN. `cdn.tjcar.mn` is not in `next.config.ts`
 * `remotePatterns`, hence `unoptimized` — same trick as `PostCard`.
 */
const IMAGE_SRC =
  "https://cdn.tjcar.mn/public/static/v2/landing/tj_container_pic.webp";

/**
 * The visual half of the login card — desktop only. Phones get the form alone,
 * full screen, so the panel never renders there.
 *
 * The source is 16:9 but this column is close to square, so `object-cover`
 * throws away most of the width. `object-[62%_50%]` biases the crop to the right
 * of centre: that keeps the TJ-branded container in frame instead of the empty
 * sea on the left.
 */
const AuthImagePanel = () => (
  <div className="relative hidden overflow-hidden bg-neutral-950 lg:block">
    <Image
      src={IMAGE_SRC}
      alt=""
      fill
      priority
      unoptimized
      sizes="(min-width: 1024px) 560px, 0px"
      className="auth-image-in object-cover object-[62%_50%]"
    />

    {/* Grounds the photo against the card's rounded corners and keeps the
        bottom edge from glaring next to the light form column. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/45 via-transparent to-neutral-950/15"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10"
    />
  </div>
);

export default AuthImagePanel;
