"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Camera,
  Clock,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Store,
  Tag,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

const RESITA_CENTER = { lat: 45.3008, lng: 21.8893 };

function formatAddressSuggestion(suggestion) {
  const address = suggestion.address || {};
  const road =
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.residential ||
    address.path ||
    "";
  const houseNumber = address.house_number || "";
  const building = address.building || suggestion.name || "";
  const city = address.city || address.town || address.village || "Resita";

  if (road) {
    const streetLine = houseNumber ? `${road} ${houseNumber}` : road;
    const details =
      building && !streetLine.toLowerCase().includes(building.toLowerCase())
        ? [streetLine, building]
        : [streetLine];

    return [...details, city].filter(Boolean).join(", ");
  }

  const parts = suggestion.display_name
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const roadLikePart = parts.find((part) =>
    /strada|calea|bulevard|bd\.|piata|aleea|drum/i.test(part),
  );

  if (roadLikePart) {
    const firstPart = parts[0] && parts[0] !== roadLikePart ? parts[0] : "";
    return [roadLikePart, firstPart, city].filter(Boolean).join(", ");
  }

  return parts.slice(0, 4).join(", ") || "Resita";
}

export default function SetupProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    category: "localuri",
    subtitle: "",
    phone: "",
    instagram: "",
    website: "",
    schedule: "08:00 - 22:00",
    imageUrl: "",
    logoUrl: "",
  });

  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    async function loadExistingBusiness() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!data) return;

      setIsEditingProfile(true);
      setFormData({
        name: data.name || "",
        category: data.category || "localuri",
        subtitle: data.subtitle || data.description || "",
        phone: data.phone || "",
        instagram: data.instagram || "",
        website: data.website || "",
        schedule: data.schedule || "08:00 - 22:00",
        imageUrl: data.image_url || "",
        logoUrl: data.logo_url || "",
      });
      setAddressInput(data.location_name || "");

      if (data.latitude && data.longitude) {
        setSelectedCoords({
          lat: Number(data.latitude),
          lng: Number(data.longitude),
        });
      }
    }

    loadExistingBusiness();
  }, []);

  useEffect(() => {
    if (addressInput.length < 4) return;

    const delayDebounceFn = setTimeout(async () => {
      setSearchingAddress(true);
      try {
        const query = `${addressInput}, Resita, Romania`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Eroare la cautarea sugestiilor:", err);
      } finally {
        setSearchingAddress(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [addressInput]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSelectAddress = (suggestion) => {
    setAddressInput(formatAddressSuggestion(suggestion));
    setSelectedCoords({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setSuggestions([]);
  };

  const uploadBusinessMedia = async (file, mediaType) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({
        type: "error",
        text: "Alege un fisier imagine valid.",
      });
      return;
    }

    setUploadingMedia(mediaType);
    setStatusMessage({ type: "", text: "" });

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Trebuie sa fii autentificat ca business.");
      }

      const isLogo = mediaType === "logo";
      const compressedFile = await imageCompression(file, {
        maxSizeMB: isLogo ? 0.08 : 0.18,
        maxWidthOrHeight: isLogo ? 320 : 1200,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: isLogo ? 0.72 : 0.68,
      });
      const filePath = `${user.id}/${isLogo ? "logo" : "cover"}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("business-media")
        .upload(filePath, compressedFile, {
          cacheControl: "60",
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("business-media")
        .getPublicUrl(filePath);
      const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      updateField(isLogo ? "logoUrl" : "imageUrl", publicUrl);
      setStatusMessage({
        type: "success",
        text: isLogo ? "Poza de profil a fost incarcata." : "Coperta a fost incarcata.",
      });
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: `Nu am putut incarca imaginea: ${err.message}`,
      });
    } finally {
      setUploadingMedia("");
    }
  };

  const saveBusiness = async (payload) => {
    const fullPayload = {
      ...payload,
      phone: formData.phone,
      instagram: formData.instagram,
      website: formData.website,
      schedule: formData.schedule,
      description: formData.subtitle,
    };

    const { error: fullError } = await supabase
      .from("businesses")
      .upsert([fullPayload]);

    if (!fullError) return;

    const { error: minimalError } = await supabase.from("businesses").upsert([
      {
        id: payload.id,
        name: payload.name,
        category: payload.category,
        latitude: payload.latitude,
        longitude: payload.longitude,
        subtitle: payload.subtitle,
        location_name: payload.location_name,
        image_url: payload.image_url,
        logo_url: payload.logo_url,
      },
    ]);

    if (minimalError) throw minimalError;
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Trebuie sa fii autentificat ca business.");
      }

      const coords = selectedCoords || RESITA_CENTER;
      const payload = {
        id: user.id,
        name: formData.name,
        category: formData.category,
        latitude: coords.lat,
        longitude: coords.lng,
        subtitle: formData.subtitle || "Locatie noua in oras",
        location_name: addressInput || "Resita",
        image_url: formData.imageUrl || "/images/resita-bg.png",
        logo_url: formData.logoUrl || null,
      };

      await saveBusiness(payload);

      await supabase.from("profiles").upsert([
        {
          id: user.id,
          name: formData.name,
          role: "business",
          category: formData.category,
          avatar_url: formData.logoUrl || null,
        },
      ]);

      setStatusMessage({
        type: "success",
        text: "Profilul business a fost salvat. Te trimitem in dashboard.",
      });

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 900);
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-6 text-white">
      <div
        className="mx-auto w-full max-w-md rounded-3xl p-6"
        style={{
          backgroundColor: "#101014",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
        }}
      >
        <div className="mb-6">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ff003c]">
            Business setup
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {isEditingProfile ? "Editeaza profilul" : "Configureaza profilul"}
          </h1>
          <p className="mt-2 text-xs font-light leading-relaxed text-zinc-500">
            Datele de aici vor fi folosite pentru postari, harta si pagina ta
            publica de business.
          </p>
        </div>

        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <Field
            icon={Store}
            label="Nume business"
            required
            value={formData.name}
            onChange={(value) => updateField("name", value)}
            placeholder="Ex: Nume business"
          />

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Tag size={14} className="text-zinc-600" />
              Categorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-[#121214] p-3 text-sm text-zinc-300 transition-colors focus:border-[#ff003c] focus:outline-none"
            >
              <option value="localuri">Cafenele / Restaurante / Cluburi</option>
              <option value="magazine">Magazine / Retail</option>
              <option value="servicii">Servicii locale</option>
              <option value="evenimente">Evenimente</option>
            </select>
          </div>

          <div className="relative">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <MapPin size={14} className="text-zinc-600" />
              Adresa in Resita
            </label>
            <div className="relative">
              <input
                type="text"
                value={addressInput}
                placeholder="Incepe sa scrii strada..."
                className="w-full rounded-xl border border-zinc-800 bg-[#121214] p-3 pr-10 text-sm text-white transition-colors focus:border-[#ff003c] focus:outline-none"
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setAddressInput(nextValue);
                  if (nextValue.length < 4) setSuggestions([]);
                  setSelectedCoords(null);
                }}
              />
              {searchingAddress && (
                <Loader2
                  size={16}
                  className="absolute right-3 top-3.5 animate-spin text-zinc-500"
                />
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-[#121214] shadow-2xl">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => handleSelectAddress(suggestion)}
                    className="block w-full truncate border-b border-zinc-900 p-3 text-left text-xs text-zinc-300 transition-colors last:border-0 hover:bg-[#ff003c]/10 hover:text-white"
                  >
                    {formatAddressSuggestion(suggestion)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Field
            icon={Clock}
            label="Program"
            value={formData.schedule}
            onChange={(value) => updateField("schedule", value)}
            placeholder="08:00 - 22:00"
          />

          <Field
            icon={Phone}
            label="Telefon"
            value={formData.phone}
            onChange={(value) => updateField("phone", value)}
            placeholder="0724 123 456"
          />

          <Field
            icon={AtSign}
            label="Instagram"
            value={formData.instagram}
            onChange={(value) => updateField("instagram", value)}
            placeholder="@business.resita"
          />

          <Field
            icon={Globe}
            label="Website"
            value={formData.website}
            onChange={(value) => updateField("website", value)}
            placeholder="business.ro"
          />

          <Field
            icon={Tag}
            label="Status scurt"
            value={formData.subtitle}
            onChange={(value) => updateField("subtitle", value)}
            placeholder="Ex: S-a deschis! / Happy hour azi"
          />

          <MediaUploadCard
            label="Poza de profil business"
            description="Logo sau poza mica. O comprimam la max 320px."
            value={formData.logoUrl}
            type="logo"
            uploading={uploadingMedia === "logo"}
            fallback={formData.name || "Business"}
            onClear={() => updateField("logoUrl", "")}
            onFileSelect={(file) => uploadBusinessMedia(file, "logo")}
          />

          <MediaUploadCard
            label="Poza de coperta"
            description="Imagine lata pentru pagina business si dashboard."
            value={formData.imageUrl}
            type="cover"
            uploading={uploadingMedia === "cover"}
            fallback={formData.name || "Business"}
            onClear={() => updateField("imageUrl", "")}
            onFileSelect={(file) => uploadBusinessMedia(file, "cover")}
          />

          <button
            type="submit"
            disabled={loading || Boolean(uploadingMedia)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ff003c] p-3.5 text-sm font-medium text-white shadow-[0_4px_20px_rgba(255,0,60,0.25)] transition-all hover:bg-[#d60032] disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading
              ? "Se salveaza..."
              : isEditingProfile
                ? "Actualizeaza profilul business"
                : "Salveaza profilul business"}
          </button>

          {statusMessage.text && (
            <div
              className={`rounded-xl border p-3 text-center text-xs ${
                statusMessage.type === "error"
                  ? "border-red-900/50 bg-red-950/20 text-red-400"
                  : "border-emerald-900/50 bg-emerald-950/20 text-emerald-400"
              }`}
            >
              {statusMessage.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function getInitials(value) {
  return (
    value
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 4)
      .toUpperCase() || "CP"
  );
}

function MediaUploadCard({
  label,
  description,
  value,
  type,
  uploading,
  fallback,
  onClear,
  onFileSelect,
}) {
  const inputId = `business-${type}-upload`;
  const isLogo = type === "logo";

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
        {isLogo ? (
          <Camera size={14} className="text-zinc-600" />
        ) : (
          <ImageIcon size={14} className="text-zinc-600" />
        )}
        {label}
      </label>
      <div
        className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#121214] ${
          isLogo ? "h-28" : "h-36"
        }`}
      >
        {value ? (
          <img
            src={value}
            alt=""
            className={`h-full w-full ${isLogo ? "object-cover" : "object-cover"}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_28%_24%,rgba(255,0,60,0.24),transparent_34%),linear-gradient(135deg,#111114,#050506)]">
            {isLogo ? (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/70 text-sm font-semibold text-[#ff003c] ring-1 ring-[#ff003c]/60">
                {getInitials(fallback)}
              </span>
            ) : (
              <ImageIcon size={28} className="text-zinc-600" />
            )}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3">
          <p className="text-xs font-medium text-white">{label}</p>
          <p className="mt-1 text-[10px] text-zinc-500">{description}</p>
        </div>

        {value && !uploading && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-black/70 text-zinc-400 transition hover:text-white"
            aria-label="Sterge imaginea"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <label className="mt-2 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-[#121214] text-xs font-medium text-zinc-400 transition hover:border-[#ff003c]/50 hover:text-white">
        {uploading ? (
          <Loader2 size={15} className="animate-spin text-[#ff003c]" />
        ) : (
          <Camera size={15} className="text-[#ff003c]" />
        )}
        {uploading ? "Se incarca..." : "Incarca imagine"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onFileSelect(file);
          }}
        />
      </label>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
        <Icon size={14} className="text-zinc-600" />
        {label}
      </label>
      <input
        type="text"
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-[#121214] p-3 text-sm text-white transition-colors placeholder:text-zinc-600 focus:border-[#ff003c] focus:outline-none"
      />
    </div>
  );
}
