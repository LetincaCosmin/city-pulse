"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Compass } from "lucide-react";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#09090b] text-xs font-light uppercase tracking-widest text-zinc-600 animate-pulse">
      Se initializeaza harta...
    </div>
  ),
});

const mapTabs = [
  "Toate",
  "Localuri",
  "Servicii",
  "Evenimente",
  "Lansari",
  "Magazine",
];

export default function MapPage() {
  const [activeTab, setActiveTab] = useState("Toate");

  return (
    <div className="fixed inset-0 bottom-[80px] flex flex-col overflow-hidden bg-[#09090b] md:relative md:inset-auto md:h-screen md:w-full md:p-8">
      <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-shrink-0 flex-col gap-4 bg-[#09090b]/90 p-5 pb-3 backdrop-blur-md md:bg-transparent md:px-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[10px] font-light uppercase tracking-widest text-zinc-500">
              Explorare Live
            </h2>
            <h1 className="mt-0.5 flex items-center gap-1.5 text-xl font-light tracking-tight text-white">
              Orasul pulseaza
              <Compass
                size={18}
                className="text-[#ff003c] animate-[spin_60s_linear_infinite]"
                strokeWidth={1.2}
              />
            </h1>
          </div>
        </div>

        <div className="-mx-5 flex w-[calc(100%+2.5rem)] snap-x gap-2 overflow-x-auto px-5 no-scrollbar">
          {mapTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-9 cursor-pointer whitespace-nowrap rounded-full border px-4 text-xs tracking-wide transition-all duration-200 ${
                activeTab === tab
                  ? "border-[#ff003c] bg-[#ff003c] font-medium text-white shadow-[0_0_15px_rgba(255,0,60,0.4)]"
                  : "border-zinc-800/60 bg-[#121214] text-zinc-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 top-0 left-0 z-10 h-full w-full overflow-hidden border-t border-zinc-900 md:relative md:inset-auto md:mx-auto md:flex-1 md:max-w-5xl md:rounded-3xl md:border">
        <MapComponent activeTab={activeTab} />
      </div>
    </div>
  );
}
