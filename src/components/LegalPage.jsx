import Link from "next/link";

import { legalInfo } from "@/data/legal";

export default function LegalPage({ eyebrow, title, children }) {
  return (
    <div className="min-h-screen bg-[#09090b] px-4 pb-14 pt-8 text-white sm:px-6">
      <header className="mb-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.45em] text-[#ff003c]">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          Ultima actualizare: {legalInfo.updatedAt}
        </p>
      </header>

      <div className="mb-6 rounded-3xl border border-[#ff003c]/25 bg-[#ff003c]/10 p-4 text-sm leading-relaxed text-red-100">
        {legalInfo.operatorNote}
      </div>

      <div className="space-y-4">{children}</div>

      <div className="mt-8 flex flex-wrap gap-2 text-xs text-zinc-500">
        <Link href="/privacy" className="hover:text-[#ff003c]">
          Confidentialitate
        </Link>
        <span>/</span>
        <Link href="/terms" className="hover:text-[#ff003c]">
          Termeni
        </Link>
        <span>/</span>
        <Link href="/cookies" className="hover:text-[#ff003c]">
          Cookies
        </Link>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5">
      <h2 className="mb-3 text-lg font-bold text-white">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff003c]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

