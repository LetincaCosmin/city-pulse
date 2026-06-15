"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import { CalendarDays, Heart, Store, X } from "lucide-react";
import { businesses as mockBusinesses } from "@/data/businesses";
import { showDemoContent } from "@/data/demo";
import { normalizeEvent } from "@/data/events";
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";

const RESITA_CENTER = [45.3008, 21.8893];

const mockLocations = mockBusinesses.map((business) => ({
  id: `mock-business-${business.id}`,
  href: `/business/${business.id}`,
  name: business.name,
  kind: "business",
  category: normalizeBusinessCategory(business.category),
  eventType: null,
  coords: business.coords,
  subtitle: business.subtitle || business.category,
  locationName: business.address || "Resita",
  time: business.status || "Deschis",
  img: business.cover || "/images/resita-bg.png",
}));

function normalizeBusinessCategory(category = "") {
  const value = category.toLowerCase();

  if (
    value.includes("servicii") ||
    value.includes("asigur") ||
    value.includes("consult") ||
    value.includes("financ") ||
    value.includes("broker") ||
    value.includes("agentie") ||
    value.includes("service")
  ) {
    return "servicii";
  }

  if (
    value.includes("magazin") ||
    value.includes("shop") ||
    value.includes("beauty") ||
    value.includes("parfum")
  ) {
    return "magazine";
  }

  return "localuri";
}

function hasValidCoords(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}

function offsetCoords(coords, index) {
  const offset = (index + 1) * 0.00035;
  return [coords[0] + offset, coords[1] - offset];
}

function normalizeBusinessLocation(business) {
  const latitude = Number(business.latitude);
  const longitude = Number(business.longitude);

  if (!hasValidCoords(latitude, longitude)) return null;

  return {
    id: `business-${business.id}`,
    businessId: business.id,
    href: `/business/${business.id}`,
    name: business.name,
    kind: "business",
    category: normalizeBusinessCategory(business.category),
    eventType: null,
    coords: [latitude, longitude],
    subtitle: business.subtitle || business.category || "Business local",
    locationName: business.location_name || "Resita",
    time: business.status || "Deschis",
    img: business.image_url || "/images/resita-bg.png",
  };
}

function normalizeEventLocation(event, businessLocation, index) {
  if (!businessLocation) return null;

  const normalizedEvent = normalizeEvent(event);
  const isLaunch = normalizedEvent.type === "Lansari";

  return {
    id: `event-${normalizedEvent.id}`,
    href: `/events/${normalizedEvent.id}`,
    name: normalizedEvent.title,
    kind: "event",
    category: isLaunch ? "lansari" : "evenimente",
    eventType: normalizedEvent.type,
    coords: offsetCoords(businessLocation.coords, index),
    subtitle: normalizedEvent.type,
    locationName: normalizedEvent.location,
    time: `${normalizedEvent.fullDate} - ${normalizedEvent.time}`,
    img: normalizedEvent.poster,
  };
}

const createCyberIcon = (location, isActive) => {
  let iconSvg = "";

  if (location.category === "localuri") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 2v7c0 1.1.9 2 2 2h1v11"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/></svg>`;
  } else if (location.category === "servicii") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/><rect width="18" height="14" x="3" y="6" rx="2"/><path d="M3 12h18"/><path d="M12 12v2"/></svg>`;
  } else if (location.category === "magazine") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  } else if (location.category === "lansari") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5V5a2 2 0 0 1 2-2h11"/><path d="M6 17h12a2 2 0 0 1 2 2v1H6a2 2 0 0 1 0-4Z"/><path d="M14 7h5"/><path d="M14 11h3"/></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`;
  }

  return new L.DivIcon({
    className: `cyber-icon-marker ${isActive ? "active" : ""}`,
    html: `<div class="w-full h-full flex items-center justify-center">${iconSvg}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

const centerIcon = new L.DivIcon({
  className: "center-pulse-marker",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function matchesActiveTab(location, activeTab) {
  const tab = activeTab.toLowerCase();

  if (tab === "toate") return true;
  if (tab === "evenimente") return location.kind === "event";
  if (tab === "lansari") return location.category === "lansari";

  return location.category === tab;
}

export default function MapComponent({ activeTab }) {
  const [locations, setLocations] = useState(() =>
    showDemoContent ? mockLocations : [],
  );
  const [selectedPlace, setSelectedPlace] = useState(() =>
    showDemoContent ? mockLocations[0] : null,
  );
  const [isCardDismissed, setIsCardDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchMapLocations() {
      const [{ data: businesses, error: businessesError }, { data: events, error: eventsError }] =
        await Promise.all([
          supabase
            .from("businesses")
            .select(
              "id,name,category,subtitle,location_name,latitude,longitude,image_url,created_at",
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("events")
            .select("*")
            .order("event_date", { ascending: true })
            .order("created_at", { ascending: false }),
        ]);

      if (businessesError) {
        console.error("Eroare la incarcarea business-urilor pe harta:", businessesError.message);
      }

      if (eventsError) {
        console.error("Eroare la incarcarea evenimentelor pe harta:", eventsError.message);
      }

      const liveBusinesses = (businesses || [])
        .map(normalizeBusinessLocation)
        .filter(Boolean);

      const businessById = new Map(
        liveBusinesses.map((business) => [business.businessId, business]),
      );

      const liveEvents = (events || [])
        .map((event, index) =>
          normalizeEventLocation(event, businessById.get(event.business_id), index),
        )
        .filter(Boolean);

      const liveBusinessIds = new Set(
        liveBusinesses.map((business) => business.businessId),
      );
      const fallbackLocations = showDemoContent
        ? mockLocations.filter(
            (location) =>
              !liveBusinessIds.has(location.href.replace("/business/", "")),
          )
        : [];
      const nextLocations = [...liveBusinesses, ...liveEvents, ...fallbackLocations];

      if (!isMounted) return;

      setLocations(nextLocations);
      setSelectedPlace(nextLocations[0] || null);
      setIsCardDismissed(false);
    }

    fetchMapLocations();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLocations = useMemo(
    () => locations.filter((location) => matchesActiveTab(location, activeTab)),
    [activeTab, locations],
  );

  const visibleSelectedPlace = useMemo(() => {
    if (isCardDismissed) return null;

    if (
      selectedPlace &&
      filteredLocations.some((location) => location.id === selectedPlace.id)
    ) {
      return selectedPlace;
    }

    return filteredLocations[0] || null;
  }, [filteredLocations, isCardDismissed, selectedPlace]);

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden">
      <div className="absolute inset-0 z-10 h-full w-full">
        <MapContainer
          center={[45.302, 21.888]}
          zoom={14.5}
          className="h-full w-full"
          zoomControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CARTO"
            className="cyber-map-tiles"
          />
          <Marker position={RESITA_CENTER} icon={centerIcon} />
          {filteredLocations.map((location) => (
            <Marker
              key={location.id}
              position={location.coords}
              icon={createCyberIcon(
                location,
                visibleSelectedPlace?.id === location.id,
              )}
              eventHandlers={{
                click: () => {
                  setSelectedPlace(location);
                  setIsCardDismissed(false);
                },
              }}
            />
          ))}
        </MapContainer>
      </div>

      {visibleSelectedPlace && (
        <div className="absolute bottom-5 left-0 right-0 z-[500] px-4 md:mx-auto md:max-w-md">
          <button
            type="button"
            onClick={() => setIsCardDismissed(true)}
            className="absolute right-7 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/75 text-zinc-400 shadow-[0_8px_20px_rgba(0,0,0,0.55)] transition-colors hover:text-white"
            aria-label="Inchide cardul"
          >
            <X size={14} strokeWidth={1.8} />
          </button>
          <Link
            href={visibleSelectedPlace.href}
            className="flex items-center gap-4 rounded-3xl border border-white/10 bg-[#0c0c0e]/95 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.9)] backdrop-blur-md"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <img
                src={visibleSelectedPlace.img}
                alt={visibleSelectedPlace.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                {visibleSelectedPlace.kind === "event" ? (
                  <CalendarDays size={11} className="text-[#ff003c]" />
                ) : (
                  <Store size={11} className="text-[#ff003c]" />
                )}
                {visibleSelectedPlace.subtitle}
              </span>
              <h3 className="mt-0.5 truncate text-sm font-semibold tracking-tight text-white">
                {visibleSelectedPlace.name}
              </h3>
              <p className="mt-0.5 truncate text-[11px] font-light text-zinc-500">
                {visibleSelectedPlace.locationName}
              </p>
              <span className="mt-1 block truncate text-[9px] font-light text-zinc-600">
                {visibleSelectedPlace.time}
              </span>
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-900 bg-zinc-950/50 text-zinc-400 transition-colors hover:text-[#ff003c]">
              <Heart size={15} strokeWidth={1.5} />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
