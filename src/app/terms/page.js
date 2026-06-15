import LegalPage, { LegalList, LegalSection } from "@/components/LegalPage";
import { legalInfo } from "@/data/legal";

export const metadata = {
  title: "Termeni si conditii | Resita Pulse",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Reguli" title="Termeni si conditii">
      <LegalSection title="1. Despre aplicatie">
        <p>
          {legalInfo.appName} este o platforma locala pentru descoperirea
          evenimentelor, postarilor si business-urilor din Resita.
        </p>
      </LegalSection>

      <LegalSection title="2. Conturi">
        <LegalList
          items={[
            "poti crea cont normal pentru a urmari evenimente si continut local",
            "poti crea cont business pentru a publica postari, evenimente si date de business",
            "esti responsabil pentru datele introduse si pentru pastrarea accesului la cont",
            "ne rezervam dreptul sa suspendam conturi folosite abuziv sau ilegal",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Continut publicat">
        <LegalList
          items={[
            "nu publica informatii false, inselatoare, discriminatorii, obscene sau ilegale",
            "nu publica date personale ale altor persoane fara drept sau acord",
            "business-urile sunt responsabile pentru program, oferte, preturi si date de contact",
            "putem elimina continut care incalca regulile sau afecteaza siguranta comunitatii",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Evenimente si business-uri">
        <p>
          Aplicatia ajuta la promovarea si descoperirea evenimentelor locale,
          dar organizatorii raman responsabili pentru eveniment, acces,
          siguranta, anulare, preturi si comunicarea cu participantii.
        </p>
      </LegalSection>

      <LegalSection title="5. Disponibilitatea serviciului">
        <p>
          Incercam sa mentinem aplicatia functionala, dar pot aparea erori,
          mentenanta sau intreruperi. Nu garantam disponibilitate permanenta sau
          lipsa erorilor.
        </p>
      </LegalSection>

      <LegalSection title="6. Raspundere">
        <p>
          Nu raspundem pentru continutul publicat de utilizatori sau business-uri,
          pentru deciziile luate pe baza informatiilor din aplicatie sau pentru
          evenimente organizate de terti.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact si raportare">
        <p>
          Pentru raportari, stergeri sau probleme juridice, scrie-ne la{" "}
          <a className="text-[#ff003c]" href={`mailto:${legalInfo.contactEmail}`}>
            {legalInfo.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}

