export const eventTypes = [
  "Toate",
  "Concerte",
  "Clubbing",
  "Festival",
  "Gaming",
  "Sport",
  "Cinema",
  "Lansari",
  "Meetups",
  "Targuri",
];

export const events = [
  {
    id: "concert-cargo",
    type: "Concerte",
    title: "Concert Cargo",
    organizer: "Club Daos",
    date: "24",
    month: "MAI",
    fullDate: "Sambata, 24 Mai 2026",
    time: "20:00",
    location: "Club Daos",
    address: "Strada Libertatii, Resita",
    attendees: 120,
    interested: 346,
    price: "Acces pe baza de invitatie",
    poster: "/images/resita-bg.png",
    description:
      "Cargo revine in Resita cu un concert exploziv. Pregateste-te pentru o seara intensa, lumini rosii, comunitate locala si energie live.",
    lineup: ["Cargo", "Warm-up DJ Set", "Afterparty local"],
    gallery: ["Scena live", "Public", "Backstage"],
    going: ["AP", "MR", "DV", "LC"],
  },
  {
    id: "street-food-festival",
    type: "Festival",
    title: "Street Food Festival",
    organizer: "City Pulse",
    date: "25",
    month: "MAI",
    fullDate: "Duminica, 25 Mai 2026",
    time: "12:00",
    location: "Parcul Tricolorului",
    address: "Parcul Tricolorului, Resita",
    attendees: 89,
    interested: 214,
    price: "Intrare libera",
    poster: "/images/resita-bg.png",
    description:
      "Food trucks, muzica, cafea, deserturi si zona de relaxare. Un eveniment local pentru prieteni, familii si business-uri din oras.",
    lineup: ["Food trucks locale", "DJ afternoon", "Zona kids"],
    gallery: ["Food court", "Zona live", "Terasa"],
    going: ["IR", "SM", "NP"],
  },
  {
    id: "gaming-night",
    type: "Gaming",
    title: "Gaming Night",
    organizer: "La Hub",
    date: "27",
    month: "MAI",
    fullDate: "Marti, 27 Mai 2026",
    time: "19:30",
    location: "La Hub",
    address: "Centrul Civic, Resita",
    attendees: 56,
    interested: 98,
    price: "20 lei",
    poster: "/images/resita-bg.png",
    description:
      "Seara pentru gameri locali: turnee rapide, socializare si premii de la parteneri. Bring your squad.",
    lineup: ["FIFA mini cup", "Retro corner", "Free play"],
    gallery: ["Setup", "Turneu", "Lounge"],
    going: ["AX", "RD", "CT"],
  },
];

const monthLabels = [
  "IAN",
  "FEB",
  "MAR",
  "APR",
  "MAI",
  "IUN",
  "IUL",
  "AUG",
  "SEP",
  "OCT",
  "NOI",
  "DEC",
];

const weekdayLabels = [
  "Duminica",
  "Luni",
  "Marti",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sambata",
];

function asArray(value, fallback) {
  if (Array.isArray(value) && value.length > 0) return value;
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

function formatFullDate(dateValue, fallback) {
  if (!dateValue) return fallback || "Data urmeaza";

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fallback || "Data urmeaza";

  const weekday = weekdayLabels[date.getDay()];
  const day = date.getDate();
  const month = monthLabels[date.getMonth()];
  const year = date.getFullYear();

  return `${weekday}, ${day} ${month} ${year}`;
}

export function normalizeEvent(event) {
  const dateValue = event.event_date || event.fullDate;
  const dateObject = event.event_date
    ? new Date(`${event.event_date}T00:00:00`)
    : null;
  const hasValidDate = dateObject && !Number.isNaN(dateObject.getTime());

  return {
    id: event.id,
    business_id: event.business_id || null,
    type: event.type || "Meetups",
    title: event.title || "Eveniment local",
    organizer: event.business_name || event.organizer || "City Pulse",
    date: event.date || (hasValidDate ? String(dateObject.getDate()) : "--"),
    month:
      event.month || (hasValidDate ? monthLabels[dateObject.getMonth()] : "CITY"),
    fullDate: event.fullDate || formatFullDate(dateValue),
    time: event.event_time || event.time || "20:00",
    location: event.location_name || event.location || "Resita",
    address: event.address || event.location_name || event.location || "Resita",
    attendees: event.attendees || 0,
    interested: event.interested || 0,
    price: event.price || "Intrare libera",
    poster: event.poster_url || event.poster || "/images/resita-bg.png",
    description:
      event.description ||
      "Eveniment local publicat pe City Pulse. Detaliile complete vor fi actualizate in curand.",
    lineup: asArray(event.lineup, ["Gazde locale", "Comunitate City Pulse"]),
    gallery: asArray(event.gallery, ["Poster", "Locatie", "Atmosfera"]),
    going: asArray(event.going, ["CP", "RS", "LV"]),
  };
}

export function mergeEvents(liveEvents = [], fallbackEvents = events) {
  const normalizedLiveEvents = liveEvents.map(normalizeEvent);
  const liveIds = new Set(normalizedLiveEvents.map((event) => event.id));
  const fallback = fallbackEvents
    .map(normalizeEvent)
    .filter((event) => !liveIds.has(event.id));

  return [...normalizedLiveEvents, ...fallback];
}

export function getEventById(id) {
  const event = events.find((item) => item.id === id);
  return event ? normalizeEvent(event) : undefined;
}
