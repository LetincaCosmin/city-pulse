import LegalPage, { LegalList, LegalSection } from "@/components/LegalPage";
import { legalInfo } from "@/data/legal";

export const metadata = {
  title: {
    absolute: "Politica cookies | Pulse City",
  },
  alternates: {
    canonical: "/cookies",
  },
};

export default function CookiesPage() {
  return (
    <LegalPage eyebrow="Cookies" title="Politica privind cookies">
      <LegalSection title="1. Ce folosim acum">
        <p>
          In aceasta versiune folosim doar tehnologii strict necesare pentru
          autentificare, securitate si functionarea aplicatiei. Nu folosim
          reclame, analytics publicitar, Meta Pixel sau Google Ads.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookies si stocare strict necesare">
        <LegalList
          items={[
            "sesiune de autentificare Supabase, pentru a ramane conectat",
            "date tehnice temporare pentru securitate si functionare",
            "preferinte locale necesare experientei din aplicatie",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. De ce nu afisam banner de consimtamant">
        <p>
          Pentru cookies strict necesare nu cerem consimtamant separat, dar te
          informam aici despre folosirea lor. Daca vom introduce cookies de
          analiza, marketing sau reclame, vom afisa un banner cu optiuni clare
          de acceptare/refuz inainte de activare.
        </p>
      </LegalSection>

      <LegalSection title="4. Cum poti controla cookies">
        <p>
          Poti sterge cookies si date locale din setarile browserului. Daca le
          blochezi complet, autentificarea sau unele functii ale aplicatiei pot
          sa nu mai functioneze corect.
        </p>
      </LegalSection>

      <LegalSection title="5. Contact">
        <p>
          Pentru intrebari despre cookies sau date personale, scrie-ne la{" "}
          <a className="text-[#ff003c]" href={`mailto:${legalInfo.contactEmail}`}>
            {legalInfo.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
