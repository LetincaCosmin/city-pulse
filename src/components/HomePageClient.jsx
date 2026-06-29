"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  CalendarDays,
  Compass,
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
import { eventTypes } from "@/data/events";
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

const MAX_POST_TAGS = 5;

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

function splitPostTags(value = "", limit = MAX_POST_TAGS) {
  const rawTags = value.match(/#[^\s,#]+|[^\s,#]+/g) || [];
  const seen = new Set();
  const tags = [];

  rawTags.forEach((rawTag) => {
    const cleanTag = rawTag.replace(/^#+/, "").trim();
    const normalizedTag = cleanTag ? `#${cleanTag}` : "";
    const tagKey = normalizedTag.toLowerCase();

    if (normalizedTag && !seen.has(tagKey)) {
      seen.add(tagKey);
      tags.push(normalizedTag);
    }
  });

  return tags.slice(0, limit);
}

function normalizePostTagInput(value = "") {
  return splitPostTags(value).join(" ");
}

function limitPostTagInput(value = "") {
  const tags = splitPostTags(value, MAX_POST_TAGS + 1);
  if (tags.length <= MAX_POST_TAGS) return value;
  return tags.slice(0, MAX_POST_TAGS).join(" ");
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
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("toate");
  const [searchQuery, setSearchQuery] = useState("");

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [pendingLikeIds, setPendingLikeIds] = useState([]);
  const [pendingSaveIds, setPendingSaveIds] = useState([]);
  const [expandedPostIds, setExpandedPostIds] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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
    let isMounted = true;

    async function fetchPostComments() {
      if (!selectedPost?.id) {
        setPostComments([]);
        setCommentsError("");
        setCommentText("");
        return;
      }

      setCommentsLoading(true);
      setCommentsError("");

      const { data, error } = await supabase
        .from("post_comments")
        .select("id, post_id, user_id, user_name, user_avatar_url, body, created_at")
        .eq("post_id", selectedPost.id)
        .order("created_at", { ascending: true });

      if (!isMounted) return;

      if (error) {
        setPostComments([]);
        setCommentsError(
          "Comentariile nu sunt configurate inca in baza de date.",
        );
      } else {
        setPostComments(data || []);
      }

      setCommentsLoading(false);
    }

    fetchPostComments();

    return () => {
      isMounted = false;
    };
  }, [selectedPost?.id]);

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
      const normalizedPostTag = normalizePostTagInput(postTypeTag) || "#AnuntNou";

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
        tag: normalizedPostTag,
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

  const togglePostExpanded = (postId) => {
    setExpandedPostIds((currentIds) =>
      currentIds.includes(postId)
        ? currentIds.filter((currentId) => currentId !== postId)
        : [...currentIds, postId],
    );
  };

  const handleSubmitPostComment = async (event) => {
    event.preventDefault();

    const cleanComment = commentText.trim();
    if (!selectedPost?.id || !cleanComment || isSubmittingComment) return;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setIsSubmittingComment(true);
    setCommentsError("");

    const newComment = {
      post_id: selectedPost.id,
      user_id: user.id,
      user_name: user.name || "Utilizator",
      user_avatar_url: user.avatarUrl || null,
      body: cleanComment,
    };

    const { data, error } = await supabase
      .from("post_comments")
      .insert([newComment])
      .select("id, post_id, user_id, user_name, user_avatar_url, body, created_at")
      .maybeSingle();

    if (error) {
      setCommentsError("Nu am putut publica comentariul momentan.");
    } else if (data) {
      setPostComments((currentComments) => [...currentComments, data]);
      setCommentText("");
    }

    setIsSubmittingComment(false);
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

  const businessById = useMemo(() => {
    const map = new Map();
    businessList.forEach((business) => {
      map.set(business.id, business);
    });
    return map;
  }, [businessList]);

  const businessByName = useMemo(() => {
    const map = new Map();
    businessList.forEach((business) => {
      if (business.name) {
        map.set(business.name.toLowerCase(), business);
      }
    });
    return map;
  }, [businessList]);

  const getPostBusiness = (post) => {
    if (post?.business_id && businessById.has(post.business_id)) {
      return businessById.get(post.business_id);
    }

    return businessByName.get(post?.business_name?.toLowerCase()) || null;
  };

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

  const selectedPostText = selectedPost ? splitPostText(selectedPost.text) : null;
  const selectedPostTags = selectedPost ? splitPostTags(selectedPost.tag) : [];
  const selectedPostBusiness = selectedPost ? getPostBusiness(selectedPost) : null;

  return (
    <>
      <header className="px-4 pt-4 pb-3 max-w-4xl mx-auto w-full relative sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-zinc-500 text-xs font-light leading-4">
              {user ? `Salut, ${user.name}` : "Buna seara,"}
            </p>
            <h1 className="text-2xl leading-7 font-semibold tracking-tight text-white flex items-center gap-2 mt-0.5">
              Resita
              <Hand
                size={21}
                className="text-[#ff003c] animate-[bounce_3s_infinite] origin-bottom -rotate-12"
                strokeWidth={1.5}
              />
            </h1>
          </div>

          <div className="flex items-center gap-2 relative">
            {user?.role === "business" && (
              <button
                onClick={openPostModal}
                className="hidden md:flex items-center gap-2 h-9 px-3.5 bg-[#ff003c] hover:bg-[#d60032] text-white font-medium text-xs rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,60,0.6)] cursor-pointer border-none"
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
                className={`w-10 h-10 bg-[#111113] rounded-xl flex items-center justify-center transition-colors cursor-pointer ring-1 ${
                  isNotificationsOpen
                    ? "ring-[#ff003c]/70 text-white"
                    : "ring-white/10 text-zinc-300 hover:text-white"
                }`}
              >
                <Bell size={18} strokeWidth={1.5} />
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
                  className="w-10 h-10 rounded-xl bg-zinc-900 bg-cover bg-center flex items-center justify-center overflow-hidden text-xs font-bold ring-1 ring-white/10 text-zinc-300"
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
                  className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center ring-1 ring-white/10 text-zinc-400 cursor-pointer transition hover:text-[#ff003c] hover:ring-[#ff003c]/40"
                  aria-label="Delogare"
                  title="Logout"
                >
                  <LogOut size={18} strokeWidth={1.6} />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="h-10 px-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-xl flex items-center justify-center"
              >
                Intra
              </Link>
            )}
          </div>
        </div>

        <div
          className="mt-3 h-11 rounded-xl flex items-center px-3.5 gap-2.5 transition-all"
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
            className="min-w-0 flex-1 bg-transparent text-xs font-light text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
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
        <section className="mb-3">
          <div className="flex gap-3 overflow-x-auto px-4 pt-1 pb-3 no-scrollbar sm:px-5">
            {categories.map(({ id, label, icon: Icon }) => {
              const isActive = activeCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveCategory(id)}
                  className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group border-none bg-transparent"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-[#ff003c]/15 text-[#ff003c] border border-[#ff003c] shadow-[inset_0_0_18px_rgba(255,0,60,0.35),0_0_18px_rgba(255,0,60,0.2)] scale-105"
                        : "bg-[#111116] text-zinc-400 border border-[#25252c] group-hover:text-white group-hover:border-[#34343d]"
                    }`}
                  >
                    <Icon size={19} strokeWidth={1.6} />
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

        <section className="px-4 space-y-4 pb-5 sm:px-5">
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
              const postTags = splitPostTags(post.tag);
              const isPostExpanded = expandedPostIds.includes(post.id);
              const hasExpandableBody =
                postText.body.length > 180 ||
                postText.body.split("\n").filter(Boolean).length > 2;
              const postBusiness = getPostBusiness(post);

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
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 overflow-hidden bg-zinc-950 rounded-2xl flex items-center justify-center ring-1 ring-white/10 text-[#ff003c]">
                        {postBusiness?.logoUrl ? (
                          <img
                            src={postBusiness.logoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Store size={18} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
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
                        {postTags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {postTags.map((tag) => (
                              <span
                                key={tag}
                                className="max-w-full truncate rounded-md border border-[#ff003c]/25 bg-[#ff003c]/10 px-2 py-1 text-[9px] font-medium leading-none tracking-wide text-[#ff003c]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <h3 className="text-[16px] font-semibold leading-snug text-white">
                      {postText.title}
                    </h3>
                    {postText.body && (
                      <div className="mt-2">
                        <p
                          className="text-[13px] font-light leading-5 text-zinc-400 whitespace-pre-line"
                          style={
                            hasExpandableBody && !isPostExpanded
                              ? {
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }
                              : undefined
                          }
                        >
                          {postText.body}
                        </p>
                        {hasExpandableBody && (
                          <button
                            type="button"
                            onClick={() => togglePostExpanded(post.id)}
                            className="mt-2 text-[11px] font-medium text-[#ff003c] transition hover:text-white"
                          >
                            {isPostExpanded ? "Arata mai putin" : "Vezi mai mult"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {post.image && (
                    <button
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="mx-4 flex max-h-[360px] w-[calc(100%-2rem)] cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/10 transition hover:ring-[#ff003c]/35"
                      aria-label={`Deschide postarea ${postText.title}`}
                    >
                      <img
                        src={post.image}
                        alt={postText.title}
                        className="block max-h-[360px] max-w-full object-contain opacity-95"
                      />
                    </button>
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
                          onClick={() => setSelectedPost(post)}
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

      {selectedPost && selectedPostText && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-4"
          onClick={() => setSelectedPost(null)}
        >
          <article
            className="no-scrollbar relative flex h-auto max-h-[94vh] w-full max-w-[560px] flex-col overflow-y-auto rounded-3xl border border-zinc-800 bg-[#111113] shadow-[0_0_35px_rgba(0,0,0,0.55)] md:h-[94vh] md:max-w-[1180px] md:flex-row md:overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-black/65 text-zinc-300 ring-1 ring-white/10 transition hover:text-white"
              aria-label="Inchide postarea"
            >
              <X size={16} />
            </button>

            {selectedPost.image && (
              <div className="flex max-h-[70vh] min-h-[300px] items-center justify-center bg-black md:h-full md:max-h-none md:min-h-0 md:flex-1">
                <img
                  src={selectedPost.image}
                  alt={selectedPostText.title}
                  className="block h-full max-h-[70vh] max-w-full object-contain md:max-h-none"
                />
              </div>
            )}

            <div className="no-scrollbar flex w-full flex-col overflow-y-auto md:h-full md:w-[380px] md:shrink-0 md:border-l md:border-zinc-800">
              <div className="border-b border-zinc-900 p-4 pb-3">
                <div className="flex items-start gap-3 pr-11">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-950 text-[#ff003c] ring-1 ring-white/10">
                    {selectedPostBusiness?.logoUrl ? (
                      <img
                        src={selectedPostBusiness.logoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-white">
                      {selectedPost.business_name}
                    </h2>
                    <p className="text-[11px] font-light text-zinc-500">recent</p>
                    {selectedPostTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedPostTags.map((tag) => (
                          <span
                            key={tag}
                            className="max-w-full truncate rounded-md border border-[#ff003c]/25 bg-[#ff003c]/10 px-2 py-1 text-[9px] font-medium leading-none tracking-wide text-[#ff003c]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-[16px] font-semibold leading-snug text-white">
                  {selectedPostText.title}
                </h3>
                {selectedPostText.body && (
                  <p className="mt-2 whitespace-pre-line text-[13px] font-light leading-5 text-zinc-400">
                    {selectedPostText.body}
                  </p>
                )}
              </div>

              <div className="mt-auto border-t border-zinc-900 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white">
                  <MessageCircle size={15} className="text-[#ff003c]" />
                  Comentarii
                </div>
                <div className="space-y-3">
                  {commentsLoading ? (
                    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-3 text-[12px] leading-relaxed text-zinc-500">
                      Se incarca comentariile...
                    </div>
                  ) : postComments.length > 0 ? (
                    postComments.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-950 text-[11px] font-semibold text-[#ff003c] ring-1 ring-white/10">
                          {comment.user_avatar_url ? (
                            <img
                              src={comment.user_avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (comment.user_name || "U").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1 rounded-2xl bg-black/30 px-3 py-2 ring-1 ring-zinc-800/80">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[12px] font-semibold text-white">
                              {comment.user_name}
                            </p>
                            <span className="shrink-0 text-[10px] text-zinc-600">
                              {formatNotificationTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-zinc-400">
                            {comment.body}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-3 text-[12px] leading-relaxed text-zinc-500">
                      Nu exista comentarii inca.
                    </div>
                  )}
                </div>

                {commentsError && (
                  <p className="mt-3 rounded-xl border border-[#ff003c]/25 bg-[#ff003c]/10 px-3 py-2 text-[11px] leading-relaxed text-red-100">
                    {commentsError}
                  </p>
                )}

                {user ? (
                  <form onSubmit={handleSubmitPostComment} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Scrie un comentariu..."
                      disabled={isSubmittingComment}
                      className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-black/35 px-3 py-2 text-[12px] text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-[#ff003c]/50"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="rounded-xl bg-[#ff003c] px-3 text-[12px] font-semibold text-white transition hover:bg-[#d60032] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                    >
                      Trimite
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    className="mt-4 block rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-center text-[12px] font-medium text-zinc-300 transition hover:border-[#ff003c]/40 hover:text-white"
                  >
                    Intra in cont ca sa comentezi
                  </Link>
                )}
              </div>
            </div>
          </article>
        </div>
      )}

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
                      Hashtaguri (max 5)
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isUploading}
                      placeholder="#OfertaFlash #Local"
                      value={postTypeTag}
                      onChange={(e) => setPostTypeTag(limitPostTagInput(e.target.value))}
                      onBlur={() => setPostTypeTag(normalizePostTagInput(postTypeTag))}
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
