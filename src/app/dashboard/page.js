"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Edit3,
  FileText,
  Heart,
  Image as ImageIcon,
  MapPin,
  Plus,
  Send,
  Sparkles,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { eventTypes, normalizeEvent } from "@/data/events";
import { createNotification } from "@/lib/notifications";
import {
  getPostLikeLabel,
  normalizePostLikeState,
  normalizePostsLikeState,
} from "@/lib/postLikes";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

function splitPostText(text = "") {
  const [firstLine, ...rest] = text.split("\n").filter(Boolean);

  return {
    title: firstLine || "Update local",
    body: rest.join("\n") || text,
  };
}

function isOfferPost(post) {
  const postCategory = post?.category?.toLowerCase?.() || "";
  const postTag = post?.tag?.toLowerCase?.() || "";

  return postCategory === "oferte" || postTag.includes("oferta");
}

function normalizeDashboardEvent(event) {
  return {
    ...normalizeEvent(event),
    event_date: event.event_date || "",
    poster_url: event.poster_url || null,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPublisherOpen, setIsPublisherOpen] = useState(false);
  const [publishMode, setPublishMode] = useState("post");
  const [isPublishing, setIsPublishing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postCategory, setPostCategory] = useState("anunturi");
  const [postTypeTag, setPostTypeTag] = useState("#AnuntNou");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState("Concerte");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventPrice, setEventPrice] = useState("Intrare libera");
  const [eventLineup, setEventLineup] = useState("");
  const [deletingItem, setDeletingItem] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);

  const business = user?.business;
  const offerPosts = useMemo(() => posts.filter((post) => isOfferPost(post)), [posts]);
  const updatePosts = useMemo(
    () => posts.filter((post) => !isOfferPost(post)),
    [posts],
  );
  const isEditingPost = Boolean(editingPostId);
  const isEditingEvent = Boolean(editingEventId);
  const isEditingPublisher = isEditingPost || isEditingEvent;

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "business") {
      return;
    }

    if (!business?.id) {
      router.replace("/setup-profile");
      return;
    }

    async function fetchDashboardData() {
      setLoadingData(true);
      setErrorMsg("");

      const [postsResult, eventsResult] = await Promise.all([
        supabase
          .from("posts")
          .select("*, post_likes(user_id)")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("events")
          .select("*")
          .eq("business_id", business.id)
          .order("event_date", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      if (postsResult.error || eventsResult.error) {
        setErrorMsg("Nu am putut incarca toate datele dashboard-ului.");
        console.error(postsResult.error || eventsResult.error);
      }

      setPosts(normalizePostsLikeState(postsResult.data || [], user?.id || null));
      setEvents((eventsResult.data || []).map(normalizeDashboardEvent));
      setLoadingData(false);
    }

    fetchDashboardData();
  }, [business?.id, router, user]);

  const stats = useMemo(
    () => [
      {
        label: "Postari",
        value: posts.length,
        icon: FileText,
      },
      {
        label: "Evenimente",
        value: events.length,
        icon: CalendarDays,
      },
      {
        label: "Pe harta",
        value: business?.latitude && business?.longitude ? "Activ" : "Lipsa",
        icon: MapPin,
      },
    ],
    [business?.latitude, business?.longitude, events.length, posts.length],
  );

  const openPublisher = (mode) => {
    setPublishMode(mode);
    setIsPublisherOpen(true);
    setEditingPostId(null);
    setEditingEventId(null);
    setTitle("");
    setContent("");
    setPostCategory("anunturi");
    setPostTypeTag("#AnuntNou");
    setSelectedImage(null);
    setImagePreview(null);
    setEventTitle("");
    setEventDescription("");
    setEventType("Concerte");
    setEventDate("");
    setEventTime("");
    setEventLocation(mode === "event" ? business?.name || "" : "");
    setEventAddress(mode === "event" ? business?.location_name || "" : "");
    setEventPrice("Intrare libera");
    setEventLineup("");
  };

  const openPostEditor = (post) => {
    const postText = splitPostText(post.text);

    setPublishMode("post");
    setIsPublisherOpen(true);
    setEditingPostId(post.id);
    setEditingEventId(null);
    setTitle(postText.title);
    setContent(postText.body);
    setPostCategory(post.category || "anunturi");
    setPostTypeTag(post.tag || "#AnuntNou");
    setSelectedImage(null);
    setImagePreview(post.image || null);
    setEventTitle("");
    setEventDescription("");
    setEventType("Concerte");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
    setEventAddress("");
    setEventPrice("Intrare libera");
    setEventLineup("");
  };

  const openEventEditor = (event) => {
    setPublishMode("event");
    setIsPublisherOpen(true);
    setEditingEventId(event.id);
    setEditingPostId(null);
    setTitle("");
    setContent("");
    setPostCategory("anunturi");
    setPostTypeTag("#AnuntNou");
    setSelectedImage(null);
    setImagePreview(event.poster_url || null);
    setEventTitle(event.title || "");
    setEventDescription(event.description || "");
    setEventType(event.type || "Concerte");
    setEventDate(event.event_date || "");
    setEventTime(event.time || "");
    setEventLocation(event.location || business?.name || "");
    setEventAddress(event.address || business?.location_name || "");
    setEventPrice(event.price || "Intrare libera");
    setEventLineup(Array.isArray(event.lineup) ? event.lineup.join("\n") : "");
  };

  const closePublisher = () => {
    setIsPublisherOpen(false);
    setIsPublishing(false);
    setEditingPostId(null);
    setEditingEventId(null);
    setPublishMode("post");
    setTitle("");
    setContent("");
    setPostCategory("anunturi");
    setPostTypeTag("#AnuntNou");
    setSelectedImage(null);
    setImagePreview(null);
    setEventTitle("");
    setEventDescription("");
    setEventType("Concerte");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
    setEventAddress("");
    setEventPrice("Intrare libera");
    setEventLineup("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadSelectedImage = async () => {
    if (!selectedImage) return null;

    const compressedFile = await imageCompression(selectedImage, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: "image/webp",
    });
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, compressedFile);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title || !content || !business?.id) return;

    setIsPublishing(true);

    try {
      const imageUrl = selectedImage ? await uploadSelectedImage() : imagePreview || null;
      const category = postCategory || "anunturi";
      const postPayload = {
        business_id: business.id,
        category,
        business_name: business.name,
        avatar:
          category === "localuri"
            ? "restaurant"
            : category === "magazine"
              ? "shop"
              : "pulse",
        tag: postTypeTag
          ? postTypeTag.startsWith("#")
            ? postTypeTag
            : `#${postTypeTag}`
          : "#AnuntNou",
        text: `${title}\n\n${content}`,
        image: imageUrl,
      };

      if (editingPostId) {
        const currentPost = posts.find((post) => post.id === editingPostId);
        const { data, error } = await supabase
          .from("posts")
          .update(postPayload)
          .eq("id", editingPostId)
          .eq("business_id", business.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const normalizedUpdatedPost = normalizePostLikeState(
            {
              ...data,
              post_likes: currentPost?.post_likes || [],
            },
            user?.id || null,
          );

          setPosts((currentPosts) =>
            currentPosts.map((post) =>
              post.id === editingPostId ? normalizedUpdatedPost : post,
            ),
          );
        }
      } else {
        const { data, error } = await supabase
          .from("posts")
          .insert([postPayload])
          .select();

        if (error) throw error;
        if (data?.[0]) {
          setPosts((currentPosts) => [
            normalizePostLikeState(data[0], user?.id || null),
            ...currentPosts,
          ]);
          await createNotification({
            targetRole: "user",
            actorId: user?.id || null,
            type: "post",
            title: "Postare noua in oras",
            body: `${business.name}: ${title}`,
            href: `/business/${business.id}`,
            metadata: {
              post_id: data[0].id,
              business_id: business.id,
            },
          });
        }
      }

      closePublisher();
    } catch (err) {
      alert("Eroare la publicare: " + err.message);
      setIsPublishing(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDescription || !eventDate || !eventLocation || !business?.id) {
      return;
    }

    setIsPublishing(true);

    try {
      const imageUrl = selectedImage ? await uploadSelectedImage() : imagePreview || null;
      const lineup = eventLineup
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      const eventPayload = {
        business_id: business.id,
        business_name: business.name,
        type: eventType,
        title: eventTitle,
        description: eventDescription,
        event_date: eventDate,
        event_time: eventTime || "20:00",
        location_name: eventLocation,
        address: eventAddress || eventLocation,
        price: eventPrice || "Intrare libera",
        poster_url: imageUrl,
        lineup,
        gallery: ["Poster", "Locatie", "Atmosfera"],
      };

      if (editingEventId) {
        const { data, error } = await supabase
          .from("events")
          .update(eventPayload)
          .eq("id", editingEventId)
          .eq("business_id", business.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const normalizedUpdatedEvent = normalizeDashboardEvent(data);
          setEvents((currentEvents) =>
            currentEvents.map((event) =>
              event.id === editingEventId ? normalizedUpdatedEvent : event,
            ),
          );
        }
      } else {
        const { data, error } = await supabase
          .from("events")
          .insert([eventPayload])
          .select();

        if (error) throw error;
        if (data?.[0]) {
          setEvents((currentEvents) => [
            normalizeDashboardEvent(data[0]),
            ...currentEvents,
          ]);
          await createNotification({
            targetRole: "user",
            actorId: user?.id || null,
            type: "event",
            title: "Eveniment nou in Resita",
            body: `${eventTitle} - ${eventLocation}`,
            href: `/events/${data[0].id}`,
            metadata: {
              event_id: data[0].id,
              business_id: business.id,
            },
          });
        }
      }

      closePublisher();
    } catch (err) {
      alert("Eroare la publicarea evenimentului: " + err.message);
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!business?.id) return;
    if (!window.confirm("Stergi aceasta postare?")) return;

    setDeletingItem(`post-${postId}`);

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("business_id", business.id);

    if (error) {
      alert("Nu am putut sterge postarea: " + error.message);
      setDeletingItem("");
      return;
    }

    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId),
    );
    setDeletingItem("");
  };

  const handleDeleteEvent = async (eventId) => {
    if (!business?.id) return;
    if (!window.confirm("Stergi acest eveniment?")) return;

    setDeletingItem(`event-${eventId}`);

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("business_id", business.id);

    if (error) {
      alert("Nu am putut sterge evenimentul: " + error.message);
      setDeletingItem("");
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventId),
    );
    setDeletingItem("");
  };

  const imageUploadField = (
    <div>
      <label className="mb-1.5 block text-[10px] font-medium uppercase text-zinc-400">
        Imagine optionala
      </label>

      {imagePreview ? (
        <div className="relative h-32 w-full overflow-hidden rounded-xl border border-zinc-800">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          {!isPublishing && (
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
              }}
              className="absolute right-2 top-2 rounded-lg border-none bg-black/70 p-1.5 text-zinc-400 transition-colors hover:bg-black hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <label className="flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-[#161619] transition-all hover:border-zinc-700 hover:bg-[#1a1a1e]">
          <ImageIcon size={18} className="mb-1 text-zinc-500" />
          <p className="text-[11px] font-light text-zinc-500">
            Apasa pentru a incarca o poza
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            disabled={isPublishing}
          />
        </label>
      )}
    </div>
  );

  if (!user) return null;

  if (user.role !== "business") {
    return (
      <div className="px-4 py-8 sm:px-5">
        <div className="rounded-3xl border border-white/10 bg-[#101014] p-5 text-center">
          <Store size={24} className="mx-auto text-[#ff003c]" />
          <h1 className="mt-3 text-xl font-semibold text-white">
            Dashboard business
          </h1>
          <p className="mt-2 text-sm font-light leading-relaxed text-zinc-500">
            Zona aceasta este disponibila pentru conturile business.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#ff003c] px-5 text-sm font-medium text-white"
          >
            Intra cu un cont business
          </Link>
        </div>
      </div>
    );
  }

  if (!business) return null;

  return (
    <div className="px-4 pb-10 pt-6 sm:px-5">
      <header className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#ff003c]">
          Business control
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Dashboard
        </h1>
      </header>

      <section
        className="relative mb-5 overflow-hidden rounded-3xl"
        style={{
          backgroundColor: "#101014",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 18px 45px rgba(0,0,0,0.42)",
        }}
      >
        <div className="relative h-40 overflow-hidden">
          <img
            src={business.image_url || "/images/resita-bg.png"}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_24%,rgba(255,0,60,0.38),transparent_32%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-black/45 to-transparent" />
        </div>

        <div className="-mt-12 px-4 pb-4">
          <div className="relative mb-4 flex items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-black/75 text-base font-semibold tracking-wide text-[#ff003c] ring-1 ring-[#ff003c]/65">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  business.name
                    ?.split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 4)
                    .toUpperCase() || "CP"
                )}
              </div>
              <div className="pb-1">
                <h2 className="max-w-[190px] truncate text-xl font-semibold text-white">
                  {business.name}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {business.category || "Business local"}
                </p>
              </div>
            </div>

            <Link
              href="/setup-profile"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/35 text-zinc-300 ring-1 ring-white/10"
            >
              <Edit3 size={16} />
            </Link>
          </div>

          <div className="grid gap-2 text-xs text-zinc-400">
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-[#ff003c]" />
              {business.location_name || "Resita"}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={14} className="text-[#ff003c]" />
              {business.schedule || "Program necompletat"}
            </span>
          </div>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => openPublisher("post")}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#ff003c] text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,0,60,0.28)]"
        >
          <Plus size={17} />
          Postare noua
        </button>
        <button
          type="button"
          onClick={() => openPublisher("event")}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#101014] text-sm font-semibold text-white ring-1 ring-white/10"
        >
          <CalendarDays size={17} className="text-[#ff003c]" />
          Eveniment
        </button>
      </section>

      <section className="mb-6 grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl bg-[#101014] p-3 ring-1 ring-white/10"
          >
            <Icon size={16} className="text-[#ff003c]" />
            <div className="mt-3 text-lg font-semibold text-white">{value}</div>
            <div className="mt-1 text-[10px] text-zinc-500">{label}</div>
          </div>
        ))}
      </section>

      {errorMsg && (
        <div className="mb-5 rounded-2xl border border-red-900/40 bg-red-950/15 p-3 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <section className="mb-6 space-y-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Continut publicat</h2>
            <p className="mt-1 text-[11px] text-zinc-500">
              Ofertele stau separat de noutatile obisnuite.
            </p>
          </div>
          <Link href="/" className="text-[11px] font-medium text-[#ff003c]">
            Feed
          </Link>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Oferte active</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                {offerPosts.length}
              </span>
            </div>
            {loadingData ? (
              <LoadingCard />
            ) : offerPosts.length > 0 ? (
              <div className="space-y-3">
                {offerPosts.slice(0, 4).map((post) => (
                  <DashboardPostCard
                    key={post.id}
                    post={post}
                    deletingItem={deletingItem}
                    onEdit={openPostEditor}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="Nu ai oferte active momentan." />
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Noutati si anunturi</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                {updatePosts.length}
              </span>
            </div>
            {loadingData ? (
              <LoadingCard />
            ) : updatePosts.length > 0 ? (
              <div className="space-y-3">
                {updatePosts.slice(0, 4).map((post) => (
                  <DashboardPostCard
                    key={post.id}
                    post={post}
                    deletingItem={deletingItem}
                    onEdit={openPostEditor}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="Nu ai noutati publicate inca." />
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Evenimente active</h2>
            <p className="mt-1 text-[11px] text-zinc-500">
              Le poti actualiza direct din dashboard.
            </p>
          </div>
          <Link href="/events" className="text-[11px] font-medium text-[#ff003c]">
            Events
          </Link>
        </div>

        {loadingData ? (
          <LoadingCard />
        ) : events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 4).map((event) => (
              <DashboardEventRow
                key={event.id}
                event={event}
                deletingItem={deletingItem}
                onEdit={openEventEditor}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="Nu ai evenimente publicate inca." />
        )}
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href={`/business/${business.id}`}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#101014] text-xs font-medium text-zinc-300 ring-1 ring-white/10"
        >
          <Store size={15} className="text-[#ff003c]" />
          Pagina publica
        </Link>
        <Link
          href="/map"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#101014] text-xs font-medium text-zinc-300 ring-1 ring-white/10"
        >
          <Send size={15} className="text-[#ff003c]" />
          Vezi pe harta
        </Link>
      </section>

      {isPublisherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl border border-zinc-800 bg-[#111113] p-6 shadow-[0_0_30px_rgba(255,0,60,0.12)] no-scrollbar">
            <button
              type="button"
              onClick={closePublisher}
              disabled={isPublishing}
              className="absolute right-5 top-5 border-none bg-transparent text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <X size={16} />
            </button>

            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white">
                <Sparkles size={14} className="text-[#ff003c]" />
                {isEditingPost
                  ? "Editezi postarea"
                  : isEditingEvent
                    ? "Editezi evenimentul"
                    : "Publica din dashboard"}
              </h3>
              <p className="mt-1 text-[11px] text-zinc-500">
                {isEditingPost
                  ? "Actualizezi continutul care apare in pagina firmei si in feed."
                  : isEditingEvent
                    ? "Actualizezi detaliile evenimentului deja publicat."
                    : `${publishMode === "post" ? "Anuntul" : "Evenimentul"} va fi incarcat live pentru ${business.name}`}
              </p>
            </div>

            {isEditingPublisher ? (
              <div className="mb-4 rounded-2xl border border-[#ff003c]/20 bg-[#ff003c]/8 px-4 py-3 text-[11px] leading-relaxed text-zinc-400">
                Poti schimba textul, poza si detaliile, apoi salvezi modificarile.
              </div>
            ) : (
              <div className="mb-4 grid grid-cols-2 rounded-2xl bg-[#161619] p-1 ring-1 ring-zinc-800">
                {[
                  ["post", "Postare"],
                  ["event", "Eveniment"],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={isPublishing}
                    onClick={() => openPublisher(mode)}
                    className={`h-9 rounded-xl border-none text-xs font-medium transition-all ${
                      publishMode === mode
                        ? "bg-[#ff003c] text-white shadow-[0_0_16px_rgba(255,0,60,0.24)]"
                        : "bg-transparent text-zinc-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {publishMode === "post" ? (
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                      Filtru
                    </label>
                    <select
                      disabled={isPublishing}
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-3 py-2 text-xs font-light text-zinc-300 focus:outline-none"
                    >
                      <option value="anunturi">Anunturi</option>
                      <option value="evenimente">Evenimente</option>
                      <option value="localuri">Localuri</option>
                      <option value="oferte">Oferte</option>
                      <option value="magazine">Magazine</option>
                      <option value="servicii">Servicii</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                      Tag
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isPublishing}
                      placeholder="#OfertaFlash"
                      value={postTypeTag}
                      onChange={(e) => setPostTypeTag(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-3 py-2 text-xs font-light text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                    Titlu
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isPublishing}
                    placeholder="Ex: Oferta noua disponibila"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-4 py-2.5 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                    Mesaj
                  </label>
                  <textarea
                    required
                    disabled={isPublishing}
                    rows={3}
                    placeholder="Scrie textul anuntului..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-[#161619] px-4 py-2.5 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                {imageUploadField}

                <button
                  type="submit"
                  disabled={isPublishing}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl border-none py-3 text-xs font-medium text-white transition-all ${
                    isPublishing
                      ? "bg-zinc-800 text-zinc-500"
                      : "bg-[#ff003c] shadow-[0_0_18px_rgba(255,0,60,0.22)] hover:bg-[#d60032]"
                  }`}
                >
                  {isPublishing
                    ? isEditingPost
                      ? "Se salveaza..."
                      : "Se publica..."
                    : isEditingPost
                      ? "Salveaza modificarile"
                      : "Lanseaza pe Resita"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                      Tip
                    </label>
                    <select
                      disabled={isPublishing}
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-3 py-2 text-xs font-light text-zinc-300 focus:outline-none"
                    >
                      {eventTypes
                        .filter((type) => type !== "Toate")
                        .map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      disabled={isPublishing}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-3 py-2 text-xs font-light text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                    Titlu eveniment
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isPublishing}
                    placeholder="Ex: Lansare carte / aplicatie web"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-4 py-2.5 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                      Ora
                    </label>
                    <input
                      type="time"
                      disabled={isPublishing}
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-3 py-2 text-xs font-light text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                      Pret
                    </label>
                    <input
                      type="text"
                      disabled={isPublishing}
                      placeholder="Intrare libera"
                      value={eventPrice}
                      onChange={(e) => setEventPrice(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-3 py-2 text-xs font-light text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                    Locatie
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isPublishing}
                    placeholder={business.name}
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-4 py-2.5 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                    Adresa
                  </label>
                  <input
                    type="text"
                    disabled={isPublishing}
                    placeholder={business.location_name || "Resita"}
                    value={eventAddress}
                    onChange={(e) => setEventAddress(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-[#161619] px-4 py-2.5 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                    Descriere
                  </label>
                  <textarea
                    required
                    disabled={isPublishing}
                    rows={3}
                    placeholder="Descrie lansarea, demo-ul sau programul..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-[#161619] px-4 py-2.5 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">
                    Lineup
                  </label>
                  <textarea
                    disabled={isPublishing}
                    rows={2}
                    placeholder={"Demo live\nNetworking local"}
                    value={eventLineup}
                    onChange={(e) => setEventLineup(e.target.value)}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-[#161619] px-4 py-2.5 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                {imageUploadField}

                <button
                  type="submit"
                  disabled={isPublishing}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl border-none py-3 text-xs font-medium text-white transition-all ${
                    isPublishing
                      ? "bg-zinc-800 text-zinc-500"
                      : "bg-[#ff003c] shadow-[0_0_18px_rgba(255,0,60,0.22)] hover:bg-[#d60032]"
                  }`}
                >
                  {isPublishing
                    ? isEditingEvent
                      ? "Se salveaza..."
                      : "Se publica..."
                    : isEditingEvent
                      ? "Actualizeaza evenimentul"
                      : "Publica evenimentul"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardPostCard({ post, deletingItem, onEdit, onDelete }) {
  const postText = splitPostText(post.text);

  return (
    <article className="overflow-hidden rounded-2xl bg-[#101014] ring-1 ring-white/10">
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="rounded-md border border-[#ff003c]/30 bg-[#ff003c]/10 px-2 py-1 text-[9px] font-medium tracking-wider text-[#ff003c]">
            {post.tag || "#Update"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(post)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-500 transition-colors hover:text-white"
              aria-label="Editeaza postarea"
            >
              <Edit3 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              disabled={deletingItem === `post-${post.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-600 transition-colors hover:text-[#ff003c] disabled:opacity-50"
              aria-label="Sterge postarea"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-white">{postText.title}</h3>
        {postText.body ? (
          <p className="mt-1 line-clamp-2 text-xs font-light leading-relaxed text-zinc-500">
            {postText.body}
          </p>
        ) : null}
        {post.image ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <img
              src={post.image}
              alt={postText.title}
              className="h-36 w-full object-cover"
            />
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <HeartBadge />
          <span>{getPostLikeLabel(post.likesCount || 0)}</span>
        </div>
      </div>
    </article>
  );
}

function DashboardEventRow({ event, deletingItem, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#101014] px-4 py-3 ring-1 ring-white/10">
      <Link href={`/events/${event.id}`} className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">
          {event.title}
        </span>
        <span className="mt-1 block truncate text-[11px] text-zinc-500">
          {event.fullDate} - {event.time}
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/events/${event.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-500 transition-colors hover:text-[#ff003c]"
          aria-label="Vezi evenimentul"
        >
          <ArrowUpRight size={14} />
        </Link>
        <button
          type="button"
          onClick={() => onEdit(event)}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-500 transition-colors hover:text-white"
          aria-label="Editeaza evenimentul"
        >
          <Edit3 size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(event.id)}
          disabled={deletingItem === `event-${event.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-600 transition-colors hover:text-[#ff003c] disabled:opacity-50"
          aria-label="Sterge evenimentul"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-2xl bg-[#101014] p-4 ring-1 ring-white/10">
      <div className="h-3 w-28 animate-pulse rounded-full bg-zinc-800" />
      <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-zinc-900" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-zinc-900" />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm font-light text-zinc-500">
      {text}
    </div>
  );
}

function HeartBadge() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ff003c]/10 text-[#ff003c] ring-1 ring-[#ff003c]/20">
      <Heart size={12} fill="currentColor" />
    </span>
  );
}
