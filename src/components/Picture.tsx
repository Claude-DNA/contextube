import type { Img } from "@/lib/images";

/** A plain lazy image; the credit shows on hover and is listed in full on the work's page. */
export function Picture({ img, className = "", eager = false }: { img: Img; className?: string; eager?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={img.url} alt={img.alt} title={img.credit} loading={eager ? "eager" : "lazy"} decoding="async" className={className} />
  );
}
