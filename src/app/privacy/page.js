import LegalPage, { LegalList, LegalSection } from "@/components/LegalPage";
import { legalInfo } from "@/data/legal";

export const metadata = {
  title: "Politica de confidentialitate | Resita Pulse",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Date personale" title="Politica de confidentialitate">
      <LegalSection title="1. Cine opereaza aplicatia">
        <p>
          {legalInfo.appName} este operata de {legalInfo.companyName}. In
          perioada de pre-lansare, operatorul poate fi persoana fizica care
          administreaza proiectul. Inainte de publicarea aplicatiei, aceasta
          sectiune trebuie completata cu numele real al operatorului sau cu
          datele firmei/PFA, daca exista.
        </p>
        <p>
          Pentru intrebari despre date personale, ne poti contacta la{" "}
          <a className="text-[#ff003c]" href={`mailto:${legalInfo.contactEmail}`}>
            {legalInfo.contactEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Ce date colectam">
        <LegalList
          items={[
            "date de cont: email, nume, tip cont si parola gestionata prin Supabase Auth",
            "date de profil: poza profil, bio, evenimente la care participi, notificari",
            "date business: nume business, categorie, adresa publica, coordonate harta, program, telefon, website, Instagram, logo si coperta",
            "continut publicat: postari, imagini, evenimente, descrieri si interactiuni",
            "date tehnice strict necesare: sesiune autentificare, loguri de securitate si erori",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. De ce folosim datele">
        <LegalList
          items={[
            "pentru creare cont, autentificare si securitate",
            "pentru afisarea feedului, hartii, evenimentelor si paginilor de business",
            "pentru notificari in aplicatie despre postari, evenimente si participari",
            "pentru moderare, prevenirea abuzurilor si functionarea serviciului",
            "pentru imbunatatirea produsului fara reclame sau tracking publicitar",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Baza legala">
        <LegalList
          items={[
            "executarea serviciului solicitat de tine, cand iti faci cont si folosesti aplicatia",
            "interes legitim pentru securitate, prevenirea abuzurilor si functionarea tehnica",
            "consimtamant acolo unde alegi optional sa incarci poze sau date publice in profil",
            "obligatii legale, daca trebuie sa raspundem unei cereri legitime a unei autoritati",
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Cine poate vedea datele">
        <p>
          Unele date sunt publice in aplicatie: postarile, evenimentele, paginile
          business si datele de contact publicate de business. Datele private de
          cont nu sunt afisate public.
        </p>
        <p>
          Folosim furnizori tehnici precum Supabase pentru autentificare, baza de
          date si storage, si Vercel pentru hosting. Acesti furnizori proceseaza
          date pentru functionarea aplicatiei.
        </p>
      </LegalSection>

      <LegalSection title="6. Cat timp pastram datele">
        <LegalList
          items={[
            "datele de cont sunt pastrate cat timp contul este activ",
            "continutul publicat ramane pana cand este sters de autor sau moderat",
            "cererile de stergere vor fi analizate si procesate intr-un termen rezonabil",
            "unele loguri tehnice pot fi pastrate temporar pentru securitate si diagnostic",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Drepturile tale">
        <p>
          Poti cere acces, rectificare, stergere, restrictionare, portabilitate
          sau opozitie privind datele tale. Trimite cererea la{" "}
          <a className="text-[#ff003c]" href={`mailto:${legalInfo.contactEmail}`}>
            {legalInfo.contactEmail}
          </a>
          .
        </p>
        <p>
          Daca nu esti multumit de raspuns, poti contacta Autoritatea Nationala
          de Supraveghere a Prelucrarii Datelor cu Caracter Personal.
        </p>
      </LegalSection>

      <LegalSection title="8. Fara reclame si tracking publicitar">
        <p>
          In aceasta versiune nu folosim Google Analytics, Meta Pixel, reclame
          personalizate sau cookie-uri de marketing. Daca vom introduce astfel
          de tehnologii, vom cere acordul inainte sa le activam.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
