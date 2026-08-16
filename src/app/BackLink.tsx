import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="link-quiet inline-flex items-center gap-1.5">
      <ArrowLeft size={14} strokeWidth={2.25} aria-hidden />
      {label}
    </Link>
  );
}
