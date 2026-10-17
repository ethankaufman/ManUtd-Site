import { stadiumPhoto } from "@/lib/stadium";

/** A free-licensed photo with its caption and credit. Renders nothing if the photo is missing. */
export default function PhotoFigure({ name, className = "", wide = false }: { name: string; className?: string; wide?: boolean }) {
  const p = stadiumPhoto(name);
  if (!p) return null;
  return (
    <figure className={className}>
      <div className={`overflow-hidden border border-white/15 bg-black ${wide ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.src} alt={p.shows} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <figcaption className="mt-1.5 text-[11px] leading-snug text-white/45">
        {p.shows}. Photo: {p.author.startsWith("Unknown author") ? "Unknown author" : p.author},{" "}
        <a href={p.licenceUrl || p.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
          {p.licence}
        </a>
        ,{" "}
        <a href={p.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
          Wikimedia Commons
        </a>
      </figcaption>
    </figure>
  );
}
