"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Bookmark,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  Gift,
  Hand,
  Heart,
  Image as ImageIcon,
  LogOut,
  MessageCircle,
  Plus,
  Radio,
  Search,
  Share2,
  Sparkles,
  Store,
  Utensils,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { businesses as mockBusinesses } from "@/data/businesses";
import { showDemoContent } from "@/data/demo";
import {
  eventTypes,
  events as mockEvents,
  mergeEvents,
  normalizeEvent,
} from "@/data/events";
import { createNotification } from "@/lib/notifications";
import {
  getPostLikeLabel,
  normalizePostLikeState,
  normalizePostsLikeState,
} from "@/lib/postLikes";
import {
  normalizePostSaveState,
  normalizePostsSaveState,
} from "@/lib/postSaves";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

const categories = [
  { id: "toate", label: "Toate", icon: Compass },
  { id: "evenimente", label: "Evenimente", icon: CalendarDays },
  { id: "localuri", label: "Localuri", icon: Utensils },
  { id: "oferte", label: "Oferte", icon: Heart },
  { id: "magazine", label: "Magazine", icon: Store },
  { id: "live", label: "Live", icon: Radio },
];

const heroCards = [
  {
    href: "/business/lokal-cafe",
    tag: "Nou in oras",
    title: "S-a deschis! Magazin de jucarii",
    subtitle: "pe Str. Aleea Tineretului",
    time: "acum 2h",
  },
  {
    href: "/business/lokal-cafe",
    tag: "Local nou",
    title: "Cafea de seara la Lokal",
    subtitle: "Piata 1 Decembrie 1918",
    time: "acum 1h",
  },
];

const offerCards = [
  {
    businessId: "sense-art",
    title: "Reducere 20%",
    subtitle: "la toate parfumurile",
    place: "Sense Art",
  },
  {
    businessId: "la-dolce-vita",
    title: "1+1 Gratis",
    subtitle: "Pizza Margherita",
    place: "La Dolce Vita",
  },
];

const liveCards = [
  { title: "Concert live", place: "Club Daos", viewers: "128" },
  { title: "Gaming Night", place: "La Hub", viewers: "56" },
  { title: "Cafe vibes", place: "Lokal Cafe", viewers: "76" },
];

function normalizeBusinessCard(business) {
  return {
    id: business.id,
    name: business.name,
    category: business.category || "Business local",
    status: business.status || "Deschis",
    cover: business.image_url || business.cover || "/images/resita-bg.png",
    logoUrl: business.logo_url || business.logoUrl || null,
    logo:
      business.logo ||
      business.name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 4)
        .toUpperCase() ||
      "CP",
  };
}

function splitPostText(text = "") {
  const [firstLine, ...rest] = text.split("\n").filter(Boolean);
  return {
    title: firstLine || "Update local",
    body: rest.join("\n") || text,
  };
}

function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "acum";

  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `acum ${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `acum ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `acum ${diffDays}z`;
}

export default function HomePageClient() {
  const { user, logout } = useAuth();
  const { isModalOpen, setIsModalOpen } = useModal();

  const [posts, setPosts] = useState([]);
  const [businessList, setBusinessList] = useState(() =>
    showDemoContent ? mockBusinesses.map(normalizeBusinessCard) : [],
  );
  const [eventList, setEventList] = useState(() =>
    mergeEvents([], showDemoContent ? mockEvents : []),
  );
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("toate");
  const [searchQuery, setSearchQuery] = useState("");

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [pendingLikeIds, setPendingLikeIds] = useState([]);
  const [pendingSaveIds, setPendingSaveIds] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postCategory, setPostCategory] = useState("anunturi");
  const [postTypeTag, setPostTypeTag] = useState("#AnuntNou");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [publishMode, setPublishMode] = useState("post");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState("Concerte");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventPrice, setEventPrice] = useState("Intrare libera");
  const [eventLineup, setEventLineup] = useState("");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroRailRef = useRef(null);
  const businessRailRef = useRef(null);

  const visibleHeroCards = useMemo(() => {
    if (showDemoContent) return heroCards;

    if (businessList.length > 0) {
      return businessList.slice(0, 2).map((business) => ({
        href: `/business/${business.id}`,
        tag: "Business local",
        title: business.name,
        subtitle: business.category,
        time: business.status || "Deschis",
      }));
    }

    return [
      {
        href: "/login",
        tag: "Early access",
        title: "Resita Pulse se pregateste de lansare",
        subtitle: "Primele noutati locale apar in curand",
        time: "MVP live",
      },
    ];
  }, [businessList]);

  const visibleOfferCards = showDemoContent ? offerCards : [];
  const visibleLiveCards = showDemoContent ? liveCards : [];
  const activeHeroDotIndex = Math.min(
    activeHeroIndex,
    Math.max(visibleHeroCards.length - 1, 0),
  );

  const openPostModal = useCallback((mode = "post") => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (user.role !== "business") {
      alert("Pentru MVP, postarile sunt disponibile pentru conturi business.");
      return;
    }

    if (!user.business?.id) {
      alert("Configureaza mai intai profilul business ca sa poti publica.");
      window.location.href = "/setup-profile";
      return;
    }

    setPostCategory(user.business?.category || user.category || "anunturi");
    setPublishMode(mode === "event" ? "event" : "post");
    setIsModalOpen(true);
  }, [setIsModalOpen, user]);

  useEffect(() => {
    const handleOpenModal = (event) => openPostModal(event.detail?.mode);
    window.addEventListener("open-post-modal", handleOpenModal);
    return () => window.removeEventListener("open-post-modal", handleOpenModal);
  }, [openPostModal]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const publishModeParam = params.get("publish");

    if (publishModeParam === "post" || publishModeParam === "event") {
      const timeoutId = window.setTimeout(() => {
        openPostModal(publishModeParam);
      }, 0);
      window.history.replaceState(null, "", window.location.pathname);

      return () => window.clearTimeout(timeoutId);
    }
  }, [openPostModal]);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);

      try {
        const [postsResult, savesResult] = await Promise.all([
          supabase
            .from("posts")
            .select("*, post_likes(user_id)")
            .order("created_at", { ascending: false }),
          user?.id
            ? supabase
                .from("post_saves")
                .select("post_id")
                .eq("user_id", user.id)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (postsResult.error) throw postsResult.error;
        if (savesResult.error) throw savesResult.error;

        const savedPostIds = new Set((savesResult.data || []).map((save) => save.post_id));
        const normalizedPosts = normalizePostsSaveState(
          normalizePostsLikeState(
            (postsResult.data || []).map((post) => ({
              ...post,
              post_saves: savedPostIds.has(post.id) && user?.id ? [{ user_id: user.id }] : [],
            })),
            user?.id || null,
          ),
          user?.id || null,
        );

        setPosts(normalizedPosts);
      } catch (err) {
        console.error("Eroare la incarcarea postarilor:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [user?.id]);

  useEffect(() => {
    async function fetchBusinesses() {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Eroare la incarcarea business-urilor:", error.message);
        return;
      }

      const liveBusinesses = (data || []).map(normalizeBusinessCard);
      const liveIds = new Set(liveBusinesses.map((business) => business.id));
      const fallbackMocks = showDemoContent
        ? mockBusinesses
            .map(normalizeBusinessCard)
            .filter((business) => !liveIds.has(business.id))
        : [];

      setBusinessList([...liveBusinesses, ...fallbackMocks]);
    }

    fetchBusinesses();
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Eroare la incarcarea evenimentelor:", error.message);
        return;
      }

      setEventList(mergeEvents(data || [], showDemoContent ? mockEvents : []));
    }

    fetchEvents();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchNotifications() {
      if (!user) {
        setNotifications([]);
        return;
      }

      setNotificationsLoading(true);

      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, href, type, created_at, notification_reads(user_id, read_at)")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .in("target_role", ["all", user.role || "user"])
        .order("created_at", { ascending: false })
        .limit(12);

      if (!isMounted) return;

      if (error) {
        console.error("Eroare la incarcarea notificarilor:", error.message);
        setNotifications([]);
      } else {
        setNotifications(
          (data || []).map((notification) => {
            const readByUser = notification.notification_reads?.some(
              (read) => read.user_id === user.id,
            );

            return {
              id: notification.id,
              title: notification.title,
              text: notification.body || notification.title,
              href: notification.href || "",
              type: notification.type,
              time: formatNotificationTime(notification.created_at),
              unread: !readByUser,
            };
          }),
        );
      }

      setNotificationsLoading(false);
    }

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const rail = heroRailRef.current;
    if (!rail) return;

    const handleHeroScroll = () => {
      const nextIndex = Math.round(rail.scrollLeft / rail.clientWidth);
      setActiveHeroIndex(
        Math.min(Math.max(nextIndex, 0), visibleHeroCards.length - 1),
      );
    };

    rail.addEventListener("scroll", handleHeroScroll, { passive: true });

    return () => rail.removeEventListener("scroll", handleHeroScroll);
  }, [visibleHeroCards.length]);

  const closeModal = () => {
    setIsModalOpen(false);
    setImagePreview(null);
    setSelectedImage(null);
    setIsUploading(false);
    setPublishMode("post");
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
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsUploading(true);

    try {
      let imageUrl = null;

      if (selectedImage) {
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

        imageUrl = publicUrlData.publicUrl;
      }

      const businessId = user?.business?.id || user?.id || null;
      const businessName = user?.business?.name || user?.name || "Business local";
      const businessCategory =
        postCategory || user?.business?.category || user?.category || "anunturi";

      if (!businessId) {
        throw new Error("Nu am gasit profilul business pentru aceasta postare.");
      }

      const newPostData = {
        business_id: businessId,
        category: businessCategory,
        business_name: businessName,
        avatar:
          businessCategory === "localuri"
            ? "restaurant"
            : businessCategory === "magazine"
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

      let { data, error } = await supabase
        .from("posts")
        .insert([newPostData])
        .select();

      if (error && error.message?.toLowerCase().includes("business_id")) {
        const legacyPostData = { ...newPostData };
        delete legacyPostData.business_id;
        ({ data, error } = await supabase
          .from("posts")
          .insert([legacyPostData])
          .select());
      }

      if (error) throw error;
      if (data?.[0]) {
        setPosts((currentPosts) => [
          normalizePostSaveState(
            normalizePostLikeState(data[0], user?.id || null),
            user?.id || null,
          ),
          ...currentPosts,
        ]);
        await createNotification({
          targetRole: "user",
          actorId: user?.id || null,
          type: "post",
          title: "Postare noua in oras",
          body: `${businessName}: ${title}`,
          href: businessId ? `/business/${businessId}` : "/",
          metadata: {
            post_id: data[0].id,
            business_id: businessId,
          },
        });
      }

      setTitle("");
      setContent("");
      setPostTypeTag("#AnuntNou");
      closeModal();
    } catch (err) {
      alert("Eroare la publicare: " + err.message);
      setIsUploading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDescription || !eventDate || !eventLocation) return;

    setIsUploading(true);

    try {
      let imageUrl = null;

      if (selectedImage) {
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

        imageUrl = publicUrlData.publicUrl;
      }

      const businessId = user?.business?.id || user?.id || null;
      const businessName = user?.business?.name || user?.name || "Business local";

      if (!businessId) {
        throw new Error("Nu am gasit profilul business pentru acest eveniment.");
      }

      const lineup = eventLineup
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const newEventData = {
        business_id: businessId,
        business_name: businessName,
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

      const { data, error } = await supabase
        .from("events")
        .insert([newEventData])
        .select();

      if (error) throw error;
      if (data?.[0]) {
        setEventList((currentEvents) => [
          normalizeEvent(data[0]),
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
            business_id: businessId,
          },
        });
      }

      setEventTitle("");
      setEventDescription("");
      setEventType("Concerte");
      setEventDate("");
      setEventTime("");
      setEventLocation("");
      setEventAddress("");
      setEventPrice("Intrare libera");
      setEventLineup("");
      closeModal();
    } catch (err) {
      alert("Eroare la publicarea evenimentului: " + err.message);
      setIsUploading(false);
    }
  };

  const handleToggleLike = async (post) => {
    if (!post?.id) return;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (pendingLikeIds.includes(post.id)) return;

    const nextLiked = !post.likedByUser;
    const previousLikes = Array.isArray(post.post_likes) ? post.post_likes : [];
    const nextLikes = nextLiked
      ? [...previousLikes, { user_id: user.id }]
      : previousLikes.filter((like) => like.user_id !== user.id);
    const nextPostState = normalizePostLikeState(
      {
        ...post,
        post_likes: nextLikes,
      },
      user.id,
    );

    setPendingLikeIds((currentIds) => [...currentIds, post.id]);
    setPosts((currentPosts) =>
      currentPosts.map((currentPost) =>
        currentPost.id === post.id ? nextPostState : currentPost,
      ),
    );

    try {
      if (nextLiked) {
        const { error } = await supabase.from("post_likes").insert([
          {
            post_id: post.id,
            user_id: user.id,
          },
        ]);

        if (error) throw error;

        if (post.business_id && post.business_id !== user.id) {
          const actorName = user.business?.name || user.name || "Un utilizator";
          const postTitle = splitPostText(post.text).title;

          await createNotification({
            userId: post.business_id,
            targetRole: "business",
            actorId: user.id,
            type: "like",
            title: "Postarea ta a primit un like",
            body: `${actorName} a apreciat "${postTitle}"`,
            href: `/business/${post.business_id}`,
            metadata: {
              post_id: post.id,
              business_id: post.business_id,
            },
          });
        }
      } else {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    } catch (err) {
      console.error("Nu am putut actualiza like-ul:", err.message);
      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id ? post : currentPost,
        ),
      );
      alert("Nu am putut actualiza like-ul: " + err.message);
    } finally {
      setPendingLikeIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== post.id),
      );
    }
  };

  const handleToggleSavePost = async (post) => {
    if (!post?.id) return;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (pendingSaveIds.includes(post.id)) return;

    const nextSaved = !post.savedByUser;
    const previousSaves = Array.isArray(post.post_saves) ? post.post_saves : [];
    const nextSaves = nextSaved
      ? [...previousSaves, { user_id: user.id }]
      : previousSaves.filter((save) => save.user_id !== user.id);
    const nextPostState = normalizePostSaveState(
      {
        ...post,
        post_saves: nextSaves,
      },
      user.id,
    );

    setPendingSaveIds((currentIds) => [...currentIds, post.id]);
    setPosts((currentPosts) =>
      currentPosts.map((currentPost) =>
        currentPost.id === post.id ? nextPostState : currentPost,
      ),
    );

    try {
      if (nextSaved) {
        const { error } = await supabase.from("post_saves").insert([
          {
            post_id: post.id,
            user_id: user.id,
          },
        ]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_saves")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    } catch (err) {
      console.error("Nu am putut actualiza salvarea postarii:", err.message);
      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id ? post : currentPost,
        ),
      );
      alert("Nu am putut actualiza salvarea: " + err.message);
    } finally {
      setPendingSaveIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== post.id),
      );
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user) return;

    const unreadIds = notifications
      .filter((notification) => notification.unread)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );

    const { error } = await supabase.from("notification_reads").upsert(
      unreadIds.map((notificationId) => ({
        notification_id: notificationId,
        user_id: user.id,
      })),
      { onConflict: "notification_id,user_id" },
    );

    if (error) {
      console.error("Nu am putut marca notificarile ca citite:", error.message);
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const scrollRail = (railRef, direction) => {
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.85, 220),
      behavior: "smooth",
    });
  };

  const scrollHeroTo = (index) => {
    const rail = heroRailRef.current;
    if (!rail) return;

    rail.scrollTo({
      left: index * rail.clientWidth,
      behavior: "smooth",
    });
    setActiveHeroIndex(index);
  };

  const businessHrefByName = useMemo(() => {
    const map = new Map();
    businessList.forEach((business) => {
      if (business.name) {
        map.set(business.name.toLowerCase(), `/business/${business.id}`);
      }
    });
    return map;
  }, [businessList]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "toate" ||
        activeCategory === "live" ||
        post.category === activeCategory;
      const searchText = searchQuery.toLowerCase();
      const matchesSearch =
        post.text?.toLowerCase().includes(searchText) ||
        post.business_name?.toLowerCase().includes(searchText) ||
        post.tag?.toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, posts, searchQuery]);

  const imageUploadField = (
    <div>
      <label className="block text-[10px] font-medium text-zinc-400 mb-1.5 uppercase">
        Imagine optionala
      </label>

      {imagePreview ? (
        <div className="relative h-32 w-full rounded-xl overflow-hidden border border-zinc-800">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {!isUploading && (
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
              }}
              className="absolute top-2 right-2 bg-black/70 hover:bg-black p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer border-none"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-20 bg-[#161619] hover:bg-[#1a1a1e] border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all group">
          <ImageIcon
            size={18}
            className="text-zinc-500 group-hover:text-[#ff003c] transition-colors mb-1"
          />
          <p className="text-[11px] text-zinc-500 font-light">
            Apasa pentru a incarca o poza
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );

  return (
    <>
      <header className="px-4 pt-7 pb-4 max-w-4xl mx-auto w-full relative sm:px-5">
        <div className="flex items-start justify-between gap-4 min-h-[72px]">
          <div>
            <p className="text-zinc-500 text-sm font-light leading-5">
              {user ? `Salut, ${user.name}` : "Buna seara,"}
            </p>
            <h1 className="text-[2rem] leading-9 font-semibold tracking-tight text-white flex items-center gap-2 mt-1">
              Resita
              <Hand
                size={25}
                className="text-[#ff003c] animate-[bounce_3s_infinite] origin-bottom -rotate-12"
                strokeWidth={1.5}
              />
            </h1>
          </div>

          <div className="flex items-center gap-3 relative pt-1">
            {user?.role === "business" && (
              <button
                onClick={openPostModal}
                className="hidden md:flex items-center gap-2 h-10 px-4 bg-[#ff003c] hover:bg-[#d60032] text-white font-medium text-xs rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,60,0.6)] cursor-pointer border-none"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Adauga</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) void markNotificationsAsRead();
                }}
                className={`w-11 h-11 bg-[#111113] rounded-2xl flex items-center justify-center transition-colors cursor-pointer ring-1 ${
                  isNotificationsOpen
                    ? "ring-[#ff003c]/70 text-white"
                    : "ring-white/10 text-zinc-300 hover:text-white"
                }`}
              >
                <Bell size={19} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff003c] text-[10px] font-semibold rounded-full flex items-center justify-center border-2 border-[#09090b] text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-[#111113] border border-zinc-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(0,0,0,0.65)] z-50">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-900">
                    <h4 className="text-xs font-semibold text-white tracking-wide uppercase">
                      Noutati Pulse
                    </h4>
                    <span className="text-[9px] text-[#ff003c] bg-[#ff003c]/10 px-2 py-1 rounded-full">
                      Live
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                    {notificationsLoading ? (
                      <div className="rounded-xl border border-zinc-900/70 bg-zinc-950/50 p-3 text-[11px] text-zinc-500">
                        Se incarca noutatile...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => {
                        const NotificationContent = (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[11px] font-semibold text-zinc-100">
                                {notification.title}
                              </p>
                              {notification.unread && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ff003c]" />
                              )}
                            </div>
                            <p className="mt-1 text-[11px] font-light leading-snug text-zinc-400">
                              {notification.text}
                            </p>
                            <span className="mt-1 block text-[9px] text-zinc-500">
                              {notification.time}
                            </span>
                          </>
                        );

                        return notification.href ? (
                          <Link
                            key={notification.id}
                            href={notification.href}
                            onClick={() => setIsNotificationsOpen(false)}
                            className="block rounded-xl border border-zinc-900/70 bg-zinc-950/50 p-3 transition hover:border-[#ff003c]/40"
                          >
                            {NotificationContent}
                          </Link>
                        ) : (
                          <div
                            key={notification.id}
                            className="rounded-xl border border-zinc-900/70 bg-zinc-950/50 p-3"
                          >
                            {NotificationContent}
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-zinc-900/70 bg-zinc-950/50 p-3 text-[11px] leading-snug text-zinc-500">
                        Nu ai notificari noi momentan.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <>
                <Link
                  href={user.role === "business" ? "/dashboard" : "/profile"}
                  className="w-11 h-11 rounded-2xl bg-zinc-900 bg-cover bg-center flex items-center justify-center overflow-hidden text-xs font-bold ring-1 ring-white/10 text-zinc-300"
                  style={
                    user.avatarUrl
                      ? { backgroundImage: `url(${user.avatarUrl})` }
                      : undefined
                  }
                  aria-label={
                    user.role === "business"
                      ? "Mergi la dashboard"
                      : "Mergi la profil"
                  }
                >
                  {user.avatarUrl
                    ? null
                    : user.avatar || user.name.charAt(0).toUpperCase()}
                </Link>
                <button
                  onClick={logout}
                  className="w-11 h-11 rounded-2xl bg-zinc-900 flex items-center justify-center ring-1 ring-white/10 text-zinc-400 cursor-pointer transition hover:text-[#ff003c] hover:ring-[#ff003c]/40"
                  aria-label="Delogare"
                  title="Logout"
                >
                  <LogOut size={18} strokeWidth={1.6} />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="h-11 px-4 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-2xl flex items-center justify-center"
              >
                Intra
              </Link>
            )}
          </div>
        </div>

        <div
          className="mt-4 h-14 rounded-2xl flex items-center px-4 gap-3 transition-all"
          style={{
            backgroundColor: "#101014",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
          }}
        >
          <Search
            size={18}
            className={searchQuery ? "text-[#ff003c]" : "text-zinc-500"}
          />
          <input
            type="text"
            placeholder="Cauta in Resita..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-light text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full pb-10">
        <section className="mb-5">
          <div className="flex justify-between items-center px-4 mb-4 sm:px-5">
            <h2 className="text-base font-semibold tracking-tight text-white">
              Ce e nou azi
            </h2>
            <button className="text-[11px] text-[#ff003c] font-medium">
              Vezi tot
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto px-4 pt-1 pb-4 no-scrollbar sm:px-5">
            {categories.map(({ id, label, icon: Icon }) => {
              const isActive = activeCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveCategory(id)}
                  className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group border-none bg-transparent"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-[#ff003c]/15 text-[#ff003c] border border-[#ff003c] shadow-[inset_0_0_18px_rgba(255,0,60,0.35),0_0_18px_rgba(255,0,60,0.2)] scale-105"
                        : "bg-[#111116] text-zinc-400 border border-[#25252c] group-hover:text-white group-hover:border-[#34343d]"
                    }`}
                  >
                    <Icon size={21} strokeWidth={1.6} />
                  </div>
                  <span
                    className={`text-[11px] ${
                      isActive ? "text-[#ff003c]" : "text-zinc-400"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="px-4 mb-7 sm:px-5">
          <div className="relative">
            <div
              ref={heroRailRef}
              className="flex gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth"
            >
              {visibleHeroCards.map((card) => (
                <Link
                  href={card.href}
                  key={card.title}
                  className="relative min-w-[100%] h-48 overflow-hidden rounded-2xl snap-start"
                  style={{
                    backgroundColor: "#101014",
                    border: "1px solid rgba(255,255,255,0.18)",
                    boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
                  }}
                >
                  <img
                    src="/images/resita-bg.png"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-75"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_26%,rgba(255,0,60,0.36),transparent_28%)]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-black/15" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 rounded-full border border-[#ff003c]/65 bg-black/55 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-[#ff003c]">
                    {card.tag}
                  </div>
                  <button className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15">
                    <Heart size={18} strokeWidth={1.7} />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="max-w-[78%] text-xl font-semibold leading-tight text-white">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-200">
                      {card.subtitle}
                    </p>
                    <p className="mt-5 text-[11px] text-zinc-500">
                      {card.time}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => scrollHeroTo(Math.max(activeHeroDotIndex - 1, 0))}
              className="hidden h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-[#ff003c]/60 hover:text-[#ff003c] md:flex"
              aria-label="Card anterior"
            >
              <ChevronLeft size={16} strokeWidth={1.8} />
            </button>
            <div className="flex justify-center gap-1.5">
              {visibleHeroCards.map((card, index) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => scrollHeroTo(index)}
                  className={`h-1.5 rounded-full border-none transition-all ${
                    activeHeroDotIndex === index
                      ? "w-5 bg-[#ff003c]"
                      : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                  }`}
                  aria-label={`Mergi la cardul ${index + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                scrollHeroTo(
                  Math.min(activeHeroDotIndex + 1, visibleHeroCards.length - 1),
                )
              }
              className="hidden h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-[#ff003c]/60 hover:text-[#ff003c] md:flex"
              aria-label="Card urmator"
            >
              <ChevronRight size={16} strokeWidth={1.8} />
            </button>
          </div>
        </section>

        <section className="px-4 mb-7 sm:px-5">
          <Link
            href="/resita"
            className="group block rounded-2xl border border-white/10 bg-[#101014] p-4 transition-colors hover:border-[#ff003c]/45"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#ff003c]">
                  Ghid local
                </p>
                <h2 className="mt-2 text-base font-semibold tracking-tight text-white">
                  Pulse City Resita
                </h2>
                <p className="mt-1 text-xs font-light leading-relaxed text-zinc-500">
                  Evenimente, business-uri, oferte si noutati locale intr-un
                  singur loc.
                </p>
              </div>
              <span className="mt-1 text-lg text-zinc-500 transition-colors group-hover:text-[#ff003c]">
                -&gt;
              </span>
            </div>
          </Link>
        </section>

        <section className="px-4 mb-7 sm:px-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-white">
              Business-uri locale
            </h2>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 md:flex">
                <button
                  type="button"
                  onClick={() => scrollRail(businessRailRef, -1)}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-[#ff003c]/60 hover:text-[#ff003c]"
                  aria-label="Business anterior"
                >
                  <ChevronLeft size={16} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(businessRailRef, 1)}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-[#ff003c]/60 hover:text-[#ff003c]"
                  aria-label="Business urmator"
                >
                  <ChevronRight size={16} strokeWidth={1.8} />
                </button>
              </div>
              <Link
                href="/business"
                className="text-[11px] font-medium text-[#ff003c]"
              >
                Vezi tot
              </Link>
            </div>
          </div>
          <div
            ref={businessRailRef}
            className="flex gap-3 overflow-x-auto pb-1 no-scrollbar scroll-smooth"
          >
            {businessList.map((business) => (
              <Link
                key={business.id}
                href={`/business/${business.id}`}
                className="relative h-36 min-w-[150px] overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: "#101014",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <img
                  src={business.cover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-65"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,0,60,0.35),transparent_28%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-black/70 text-[10px] font-semibold text-[#ff003c] ring-1 ring-[#ff003c]/55">
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    business.logo
                  )}
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="truncate text-sm font-semibold text-white">
                    {business.name}
                  </h3>
                  <p className="mt-1 truncate text-[10px] text-zinc-400">
                    {business.category}
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-400">
                    {business.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-4 mb-7 sm:px-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-white">
              Evenimente recomandate
            </h2>
            <Link href="/events" className="text-[11px] font-medium text-[#ff003c]">
              Vezi tot
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {eventList.slice(0, 2).map((event) => (
              <Link
                href={`/events/${event.id}`}
                key={event.title}
                className="relative h-48 overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: "#101014",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <img
                  src={event.poster}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-65"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_28%,rgba(255,0,60,0.34),transparent_28%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                <div className="absolute left-3 top-3 w-11 overflow-hidden rounded-xl bg-black/70 text-center ring-1 ring-[#ff003c]/70">
                  <div className="pt-1 text-lg font-semibold leading-6 text-white">
                    {event.date}
                  </div>
                  <div className="bg-[#ff003c] py-0.5 text-[10px] text-white">
                    {event.month}
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-semibold leading-tight text-white">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-300">
                    {event.location}
                  </p>
                  <p className="mt-2 text-[10px] text-zinc-500">
                    {event.time} - {event.attendees} merg
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {visibleOfferCards.length > 0 && (
          <section className="px-4 mb-7 sm:px-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-white">
                Oferte pentru tine
              </h2>
              <button className="text-[11px] font-medium text-zinc-500">
                Vezi tot
              </button>
            </div>
            <div className="space-y-3">
              {visibleOfferCards.map((offer, index) => (
                <Link
                  href={`/business/${offer.businessId}`}
                  key={offer.title}
                  className="relative block min-h-28 w-full overflow-hidden rounded-2xl"
                  style={{
                    backgroundColor: "#101014",
                    border: "1px solid rgba(255,255,255,0.16)",
                    boxShadow: "0 16px 36px rgba(0,0,0,0.32)",
                  }}
                >
                  <div
                    className="absolute right-0 top-0 h-full w-32 sm:w-36"
                    style={{
                      background:
                        index === 0
                          ? "radial-gradient(circle at 48% 42%, rgba(255,255,255,0.5), transparent 18%), linear-gradient(145deg, #310c17, #ff003c 55%, #0a0a0d)"
                          : "radial-gradient(circle at 48% 42%, rgba(255,212,128,0.5), transparent 22%), linear-gradient(145deg, #3b1508, #7a2414 55%, #0a0a0d)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#101012] via-[#101012]/90 to-[#101012]/20" />
                  <div className="relative max-w-[68%] p-4">
                    <Gift size={18} className="mb-3 text-[#ff003c]" />
                    <h3 className="text-sm font-semibold text-white">
                      {offer.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-200">
                      {offer.subtitle}
                    </p>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      {offer.place}
                    </p>
                  </div>
                  <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/15">
                    <Heart size={15} />
                  </button>
                </Link>
              ))}
            </div>
          </section>
        )}

        {visibleLiveCards.length > 0 && (
          <section className="px-4 mb-7 sm:px-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-white">
                Live acum in Resita
              </h2>
              <button className="text-[11px] font-medium text-[#ff003c]">
                Vezi tot
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {visibleLiveCards.map((item, index) => (
                <article
                  key={item.title}
                  className="relative h-40 overflow-hidden rounded-2xl"
                  style={{
                    backgroundColor: "#101014",
                    border: "1px solid rgba(255,255,255,0.16)",
                  }}
                >
                  <img
                    src="/images/resita-bg.png"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-65"
                  />
                  <div
                    className={`absolute inset-0 ${
                      index === 1
                        ? "bg-[radial-gradient(circle_at_70%_20%,rgba(0,196,255,0.25),transparent_28%)]"
                        : "bg-[radial-gradient(circle_at_52%_22%,rgba(255,0,60,0.36),transparent_30%)]"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                  <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-1">
                    <span className="rounded-md bg-[#ff003c] px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                      Live
                    </span>
                    <span className="rounded-md bg-black/50 px-1.5 py-1 text-[9px] text-white">
                      {item.viewers}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-xs font-semibold leading-tight text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[10px] text-zinc-400">
                      {item.place}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="px-4 space-y-4 pb-5 sm:px-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-white">
              Feed local
            </h2>
            <span className="text-[10px] bg-[#ff003c]/10 text-[#ff003c] px-2.5 py-1 rounded-full border border-[#ff003c]/20">
              Orasul live
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-light tracking-widest uppercase animate-pulse">
              Se incarca pulsul orasului...
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              const postText = splitPostText(post.text);
              const businessHref = post.business_id
                ? `/business/${post.business_id}`
                : businessHrefByName.get(post.business_name?.toLowerCase());
              const isLikePending = pendingLikeIds.includes(post.id);
              const isSavePending = pendingSaveIds.includes(post.id);

              return (
                <article
                  key={post.id}
                  id={`post-${post.id}`}
                  className="relative overflow-hidden rounded-3xl transition-all duration-300 group"
                  style={{
                    backgroundColor: "#101014",
                    border: "1px solid rgba(255,255,255,0.16)",
                    boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
                  }}
                >
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-zinc-950 rounded-2xl flex items-center justify-center ring-1 ring-white/10 text-[#ff003c]">
                        <Store size={18} />
                      </div>
                      <div className="min-w-0">
                        {businessHref ? (
                          <Link
                            href={businessHref}
                            className="block text-sm font-semibold text-white transition-colors hover:text-[#ff003c] truncate"
                          >
                            {post.business_name}
                          </Link>
                        ) : (
                          <h3 className="text-sm font-semibold text-white group-hover:text-[#ff003c] transition-colors truncate">
                            {post.business_name}
                          </h3>
                        )}
                        <p className="text-[11px] text-zinc-500 font-light">
                          recent
                        </p>
                      </div>
                    </div>
                    <span className="bg-[#ff003c]/10 text-[#ff003c] border border-[#ff003c]/30 text-[9px] font-medium px-2 py-1 rounded-md tracking-wider">
                      {post.tag}
                    </span>
                  </div>

                  <div className="px-4 pb-4">
                    <h3 className="text-lg font-semibold text-white leading-tight">
                      {postText.title}
                    </h3>
                    {postText.body && (
                      <p className="text-zinc-400 text-sm font-light leading-relaxed whitespace-pre-line mt-2">
                        {postText.body}
                      </p>
                    )}
                  </div>

                  {post.image && (
                    <div className="mx-4 overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/10">
                      <img
                        src={post.image}
                        alt={postText.title}
                        className="block w-full h-auto max-h-[520px] object-contain opacity-95"
                      />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-4 text-zinc-500">
                        <button
                          type="button"
                          onClick={() => void handleToggleLike(post)}
                          disabled={isLikePending}
                          aria-pressed={post.likedByUser}
                          title={getPostLikeLabel(post.likesCount || 0)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.likedByUser
                              ? "text-[#ff003c]"
                              : "hover:text-[#ff003c]"
                          } ${isLikePending ? "opacity-60" : ""}`}
                        >
                          <Heart
                            size={18}
                            fill={post.likedByUser ? "currentColor" : "none"}
                          />
                          <span className="text-[11px] font-medium">
                            {post.likesCount || 0}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="hover:text-white transition-colors"
                        >
                          <MessageCircle size={18} />
                        </button>
                        <button
                          type="button"
                          className="hover:text-white transition-colors"
                        >
                          <Share2 size={18} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleToggleSavePost(post)}
                        disabled={isSavePending}
                        aria-pressed={post.savedByUser}
                        className={`w-9 h-9 rounded-xl ring-1 ring-white/10 flex items-center justify-center transition-colors ${
                          post.savedByUser
                            ? "text-[#ff003c]"
                            : "text-zinc-400 hover:text-white"
                        } ${isSavePending ? "opacity-60" : ""}`}
                      >
                        <Bookmark
                          size={15}
                          fill={post.savedByUser ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-3xl">
              <p className="text-zinc-500 text-xs font-light">
                Niciun rezultat gasit pentru cautarea sau filtrul selectat.
              </p>
            </div>
          )}
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111113] border border-zinc-800 rounded-3xl w-full max-w-md max-h-[88vh] overflow-y-auto no-scrollbar p-6 relative shadow-[0_0_30px_rgba(255,0,60,0.12)]">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-300 cursor-pointer border-none bg-transparent"
              disabled={isUploading}
            >
              <X size={16} />
            </button>

            <div className="mb-5">
              <h3 className="text-sm font-medium uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles size={14} className="text-[#ff003c]" />
                Publica pe oras
              </h3>
              <p className="text-zinc-500 text-[11px] mt-1">
                {publishMode === "post" ? "Anuntul" : "Evenimentul"} va fi
                incarcat live pentru{" "}
                {user?.business?.name || user?.name || "business-ul tau"}
              </p>
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-2xl bg-[#161619] p-1 ring-1 ring-zinc-800">
              {[
                ["post", "Postare"],
                ["event", "Eveniment"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  disabled={isUploading}
                  onClick={() => setPublishMode(mode)}
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

            {publishMode === "post" ? (
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                      Filtru
                    </label>
                    <select
                      disabled={isUploading}
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2 px-3 text-xs font-light text-zinc-300 focus:outline-none"
                    >
                      <option value="anunturi">Anunturi</option>
                      <option value="evenimente">Evenimente</option>
                      <option value="localuri">Localuri</option>
                      <option value="oferte">Oferte</option>
                      <option value="magazine">Magazine</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                      Tag
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isUploading}
                      placeholder="#OfertaFlash"
                      value={postTypeTag}
                      onChange={(e) => setPostTypeTag(e.target.value)}
                      className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2 px-3 text-xs font-light text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                    Titlu
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isUploading}
                    placeholder="Ex: Meniu nou disponibil"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                    Mesaj
                  </label>
                  <textarea
                    required
                    disabled={isUploading}
                    rows={3}
                    placeholder="Scrie textul anuntului..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-light text-zinc-200 focus:outline-none resize-none"
                  />
                </div>

                {imageUploadField}

                <button
                  type="submit"
                  disabled={isUploading}
                  className={`w-full text-white text-xs font-medium py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all border-none ${
                    isUploading
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                      : "bg-[#ff003c] hover:bg-[#d60032] shadow-[0_0_18px_rgba(255,0,60,0.22)]"
                  }`}
                >
                  {isUploading ? "Se publica..." : "Lanseaza pe Resita"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                      Tip
                    </label>
                    <select
                      disabled={isUploading}
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2 px-3 text-xs font-light text-zinc-300 focus:outline-none"
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
                    <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      disabled={isUploading}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2 px-3 text-xs font-light text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                    Titlu eveniment
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isUploading}
                    placeholder="Ex: Lansare carte / aplicatie web"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                      Ora
                    </label>
                    <input
                      type="time"
                      disabled={isUploading}
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2 px-3 text-xs font-light text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                      Pret
                    </label>
                    <input
                      type="text"
                      disabled={isUploading}
                      placeholder="Intrare libera"
                      value={eventPrice}
                      onChange={(e) => setEventPrice(e.target.value)}
                      className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2 px-3 text-xs font-light text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                    Locatie
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isUploading}
                    placeholder="Ex: Nume locatie"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                    Adresa
                  </label>
                  <input
                    type="text"
                    disabled={isUploading}
                    placeholder="Ex: Piata 1 Decembrie 1918"
                    value={eventAddress}
                    onChange={(e) => setEventAddress(e.target.value)}
                    className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-light text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                    Descriere
                  </label>
                  <textarea
                    required
                    disabled={isUploading}
                    rows={3}
                    placeholder="Descrie lansarea, invitatul, demo-ul sau programul..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-light text-zinc-200 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-400 mb-1 uppercase">
                    Lineup
                  </label>
                  <textarea
                    disabled={isUploading}
                    rows={2}
                    placeholder={"DJ set\nAfterparty local"}
                    value={eventLineup}
                    onChange={(e) => setEventLineup(e.target.value)}
                    className="w-full bg-[#161619] border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-light text-zinc-200 focus:outline-none resize-none"
                  />
                </div>

                {imageUploadField}

                <button
                  type="submit"
                  disabled={isUploading}
                  className={`w-full text-white text-xs font-medium py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all border-none ${
                    isUploading
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                      : "bg-[#ff003c] hover:bg-[#d60032] shadow-[0_0_18px_rgba(255,0,60,0.22)]"
                  }`}
                >
                  {isUploading ? "Se publica..." : "Publica evenimentul"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
