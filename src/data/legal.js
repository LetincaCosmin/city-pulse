export const legalInfo = {
  appName: "Resita Pulse",
  companyName: process.env.NEXT_PUBLIC_OPERATOR_NAME || "operatorul aplicatiei",
  operatorNote:
    "Versiune pre-lansare: daca nu ai firma, poti opera proiectul ca persoana fizica. Inainte de publicare, inlocuieste acest text cu numele real al operatorului si un email activ de contact. Adauga CUI doar daca exista PFA/SRL.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "adauga-email@exemplu.ro",
  city: "Resita, Romania",
  updatedAt: "12 iunie 2026",
};
