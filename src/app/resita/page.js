import Link from "next/link";

const siteUrl = "https://pulsecity.ro";

export const metadata = {
  title: {
    absolute: "Resita Pulse - Evenimente, Business-uri si Noutati Locale",
  },
  description:
    "Descopera evenimente in Resita, business-uri locale, localuri, oferte, anunturi si noutati din oras pe Pulse City.",
  keywords: [
    "Resita",
    "evenimente Resita",
    "noutati Resita",
    "ce se intampla in Resita",
    "business-uri Resita",
    "localuri Resita",
    "restaurante Resita",
    "oferte Resita",
    "anunturi Resita",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/resita",
  },
  openGraph: {
    title: "Resita Pulse - Evenimente, Business-uri si Noutati Locale",
    description:
      "Ghid local Pulse City pentru Resita: evenimente, business-uri, localuri, oferte si noutati din oras.",
    url: "/resita",
    images: ["/images/resita-bg.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resita Pulse - Evenimente, Business-uri si Noutati Locale",
    description:
      "Evenimente, business-uri, localuri, oferte si noutati din Resita pe Pulse City.",
    images: ["/images/resita-bg.png"],
  },
};

const faqItems = [
  {
    question: "Unde gasesc evenimente in Resita?",
    answer:
      "Pe Pulse City poti descoperi evenimente locale din Resita, de la concerte si festivaluri pana la meetups, lansari, activitati de weekend si iesiri recomandate de comunitate.",
  },
  {
    question: "Cum gasesc business-uri locale din Resita?",
    answer:
      "Sectiunea Business-uri aduna localuri, restaurante, servicii, magazine si afaceri locale din Resita, cu detalii precum adresa, categorie, program si noutati publicate de fiecare business.",
  },
  {
    question: "Pot promova un business local pe Pulse City?",
    answer:
      "Da. Business-urile locale isi pot crea cont si pot publica postari, oferte, evenimente si informatii utile pentru oamenii din Resita.",
  },
  {
    question: "Pulse City este doar pentru Resita?",
    answer:
      "In aceasta etapa, Pulse City este construit in jurul orasului Resita, cu focus pe comunitate locala, evenimente, business-uri, anunturi si harta live.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Resita Pulse - Evenimente, Business-uri si Noutati Locale",
    url: `${siteUrl}/resita`,
    isPartOf: {
      "@type": "WebSite",
      name: "Pulse City",
      url: siteUrl,
    },
    about: {
      "@type": "City",
      name: "Resita",
      address: {
        "@type": "PostalAddress",
        addressCountry: "RO",
        addressRegion: "Caras-Severin",
      },
    },
    description:
      "Ghid local pentru evenimente, business-uri, localuri, oferte, anunturi si noutati din Resita.",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
];

export default function ResitaPage() {
  return (
    <main className="bg-[#09090b] px-4 pb-14 pt-7 text-white sm:px-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative mb-7 overflow-hidden rounded-3xl border border-white/10 bg-[#101014] p-5">
        <img
          src="/images/resita-bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(255,0,60,0.34),transparent_30%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-black/40" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#ff003c]">
            Ghid local
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white">
            Resita Pulse - Evenimente, Business-uri si Noutati Locale
          </h1>
          <p className="mt-4 text-sm font-light leading-relaxed text-zinc-300">
            Pulse City este locul in care descoperi ce se intampla in Resita:
            evenimente, localuri, business-uri, oferte, anunturi si noutati
            utile pentru oras.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/events"
              className="rounded-full bg-[#ff003c] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(255,0,60,0.25)]"
            >
              Vezi evenimente
            </Link>
            <Link
              href="/business"
              className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold text-zinc-200"
            >
              Business-uri locale
            </Link>
            <Link
              href="/map"
              className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold text-zinc-200"
            >
              Harta live
            </Link>
          </div>
        </div>
      </section>

      <article className="space-y-6 text-sm font-light leading-relaxed text-zinc-400">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">
            Ce se intampla in Resita
          </h2>
          <p>
            Resita este un oras in schimbare, cu evenimente locale, localuri
            noi, afaceri mici, initiative creative si locuri care merita
            descoperite. Pulse City aduna aceste semnale intr-un singur loc,
            pentru ca oamenii din oras sa poata vedea rapid ce este nou, ce se
            organizeaza in weekend, unde apar oferte si ce business-uri locale
            sunt active.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">
            Evenimente in Resita
          </h2>
          <p>
            Daca vrei sa afli ce evenimente sunt in Resita, Pulse City te ajuta
            sa gasesti concerte, festivaluri, seri tematice, meetups, activitati
            pentru comunitate si iesiri locale. Pagina de evenimente este gandita
            pentru descoperire rapida: data, ora, locatie, descriere si detalii
            utile pentru participanti.
          </p>
          <p className="mt-3">
            Pentru organizatori si business-uri, evenimentele pot deveni o
            metoda simpla de a anunta comunitatea locala despre lansari, seri
            speciale, promotii sau activitati care merita vazute.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">
            Business-uri, restaurante si localuri din Resita
          </h2>
          <p>
            Pulse City pune accent pe afacerile locale: restaurante, cafenele,
            magazine, servicii, saloane, spatii creative si alte business-uri
            din Resita. Fiecare pagina de business poate include adresa,
            categoria, programul, descrierea, poze, evenimente si postari utile
            pentru clienti.
          </p>
          <p className="mt-3">
            Pentru utilizatori, asta inseamna o metoda mai usoara de a descoperi
            locuri noi. Pentru antreprenori, inseamna vizibilitate locala intr-un
            spatiu construit special pentru oras.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">
            Oferte, anunturi si noutati locale
          </h2>
          <p>
            Pe langa evenimente si business-uri, Pulse City poate functiona ca
            un flux local de noutati scurte: oferte, anunturi, lansari,
            schimbari de program, recomandari si update-uri publicate direct de
            business-uri. Scopul este sa reducem zgomotul si sa facem mai usor
            de urmarit ce conteaza in Resita.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">
            Harta live pentru oras
          </h2>
          <p>
            Harta Pulse City ajuta oamenii sa vada unde sunt localurile,
            serviciile, magazinele si evenimentele din Resita. Pentru cautari
            locale, harta este importanta pentru ca leaga informatia de locuri
            reale, usor de gasit si vizitat.
          </p>
        </section>
      </article>

      <section className="mt-8 rounded-3xl border border-white/10 bg-[#101014] p-5">
        <h2 className="text-xl font-semibold text-white">
          Intrebari rapide despre Pulse City Resita
        </h2>
        <div className="mt-4 space-y-4">
          {faqItems.map((item) => (
            <div key={item.question}>
              <h3 className="text-sm font-semibold text-white">
                {item.question}
              </h3>
              <p className="mt-1 text-sm font-light leading-relaxed text-zinc-400">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
