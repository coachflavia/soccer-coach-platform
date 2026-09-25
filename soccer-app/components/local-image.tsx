import Image from "next/image";

export function LocalImage({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={512} height={512} unoptimized className="h-full w-full object-cover" />;
}
