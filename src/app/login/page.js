"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Mail,
  Sparkles,
  Store,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const passwordChecks = [
  {
    label: "Minim 8 caractere",
    test: (value) => value.length >= 8,
  },
  {
    label: "Litera mare si litera mica",
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  {
    label: "Cel putin un numar",
    test: (value) => /\d/.test(value),
  },
  {
    label: "Cel putin un simbol",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetRequest, setIsResetRequest] = useState(false);
  const [accountType, setAccountType] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("localuri");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const profileName = accountType === "business" ? businessName : name;
  const passwordValidation = passwordChecks.map((check) => ({
    ...check,
    isValid: check.test(password),
  }));
  const isPasswordStrong = passwordValidation.every((check) => check.isValid);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextInfoMsg =
      params.get("confirmed") === "1"
        ? "Email confirmat. Te poti conecta acum."
        : params.get("passwordReset") === "1"
          ? "Parola a fost schimbata. Te poti conecta cu parola noua."
          : "";

    if (!nextInfoMsg) return undefined;

    const timeout = window.setTimeout(() => {
      setInfoMsg(nextInfoMsg);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const getRedirectUrl = (path) => {
    if (typeof window === "undefined") return undefined;
    return `${window.location.origin}${path}`;
  };

  const saveProfile = async (authUser) => {
    if (!authUser?.id) return;

    await supabase.from("profiles").upsert([
      {
        id: authUser.id,
        name: profileName,
        role: accountType,
        category: accountType === "business" ? businessCategory : null,
      },
    ]);
  };

  const getLoginDestination = async (authUser) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle();

    const fallbackProfile = {
      role: authUser.user_metadata?.role || "user",
      name: authUser.user_metadata?.name || authUser.email?.split("@")[0],
      category: authUser.user_metadata?.category || null,
    };
    const role = profile?.role || fallbackProfile.role;

    if (!profile) {
      await supabase.from("profiles").upsert([
        {
          id: authUser.id,
          name: fallbackProfile.name,
          role,
          category: fallbackProfile.category,
        },
      ]);
    }

    if (role !== "business") {
      return "/";
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    return business ? "/" : "/setup-profile";
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    try {
      if (!email) {
        throw new Error("Introdu emailul contului.");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl("/reset-password"),
      });

      if (error) throw error;

      setInfoMsg(
        "Daca exista un cont cu acest email, am trimis un link pentru resetarea parolei.",
      );
    } catch (err) {
      setErrorMsg(err.message || "Nu am putut trimite emailul de resetare.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!isPasswordStrong) {
          throw new Error(
            "Parola trebuie sa aiba minim 8 caractere, litere mari si mici, un numar si un simbol.",
          );
        }

        if (!acceptedLegal) {
          throw new Error(
            "Trebuie sa accepti termenii si politica de confidentialitate.",
          );
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectUrl("/login?confirmed=1"),
            data: {
              name: profileName,
              role: accountType,
              category: accountType === "business" ? businessCategory : null,
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          setInfoMsg(
            "Ti-am trimis un email de confirmare. Verifica inbox-ul si apasa pe link ca sa activezi contul.",
          );
          setIsSignUp(false);
          setPassword("");
          setAcceptedLegal(false);
          return;
        }

        await saveProfile(data.user);

        router.push(accountType === "business" ? "/setup-profile" : "/");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const destination = await getLoginDestination(data.user);
      router.push(destination);
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message || "A aparut o eroare.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] p-4">
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff003c]/7 blur-[120px]" />

      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{
          backgroundColor: "#101014",
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-light uppercase tracking-[0.24em] text-white">
            Resita
            <span className="ml-2 font-medium tracking-[0.18em] text-[#ff003c]">
              Pulse
            </span>
          </h1>
          <p className="mt-2 text-xs font-light text-zinc-500">
            {isSignUp
              ? "Creeaza contul si intra in oras"
              : isResetRequest
                ? "Primeste link pentru resetarea parolei"
              : "Conecteaza-te la pulsul orasului"}
          </p>
        </div>

        {infoMsg && (
          <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-xs text-emerald-300">
            {infoMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {isSignUp && !isResetRequest && (
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-black/30 p-1 ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setAccountType("user")}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-medium transition-all ${
                accountType === "user"
                  ? "bg-[#ff003c]/15 text-[#ff003c] ring-1 ring-[#ff003c]/40"
                  : "text-zinc-400"
              }`}
            >
              <User size={14} />
              Cetatean
            </button>
            <button
              type="button"
              onClick={() => setAccountType("business")}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-medium transition-all ${
                accountType === "business"
                  ? "bg-[#ff003c]/15 text-[#ff003c] ring-1 ring-[#ff003c]/40"
                  : "text-zinc-400"
              }`}
            >
              <Store size={14} />
              Business
            </button>
          </div>
        )}

        <form
          onSubmit={isResetRequest ? handleResetRequest : handleSubmit}
          className="space-y-4"
        >
          {isSignUp && (
            <Field
              icon={Sparkles}
              label={accountType === "business" ? "Nume business" : "Nume"}
              value={profileName}
              onChange={(value) =>
                accountType === "business"
                  ? setBusinessName(value)
                  : setName(value)
              }
              placeholder={
                accountType === "business" ? "Ex: Nume business" : "Ex: Prenume Nume"
              }
            />
          )}

          {isSignUp && accountType === "business" && (
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Categorie
              </label>
              <div className="relative flex items-center">
                <Layers
                  size={14}
                  className="pointer-events-none absolute left-4 text-zinc-500"
                />
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-zinc-800 bg-[#161619] py-3 pl-11 pr-4 text-xs font-light text-zinc-200 transition-all focus:border-[#ff003c]/40 focus:outline-none"
                >
                  <option value="localuri">Localuri & restaurante</option>
                  <option value="magazine">Magazine & retail</option>
                  <option value="servicii">Servicii locale</option>
                  <option value="evenimente">Evenimente</option>
                </select>
              </div>
            </div>
          )}

          <Field
            icon={Mail}
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="nume@email.ro"
          />

          {!isResetRequest && (
            <Field
              icon={Lock}
              label="Parola"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder={isSignUp ? "Minim 8 caractere" : "Parola"}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label={showPassword ? "Ascunde parola" : "Arata parola"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          )}

          {isSignUp && !isResetRequest && (
            <div className="rounded-2xl border border-zinc-800 bg-black/25 p-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Parola sigura
              </p>
              <div className="grid gap-1.5">
                {passwordValidation.map((check) => (
                  <div
                    key={check.label}
                    className={`flex items-center gap-2 text-[11px] transition-colors ${
                      check.isValid ? "text-[#ff003c]" : "text-zinc-600"
                    }`}
                  >
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border ${
                        check.isValid
                          ? "border-[#ff003c] bg-[#ff003c]/15"
                          : "border-zinc-800"
                      }`}
                    >
                      {check.isValid ? <Check size={10} strokeWidth={2.4} /> : null}
                    </span>
                    {check.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSignUp && !isResetRequest && (
            <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-black/25 p-3 text-[11px] leading-relaxed text-zinc-500">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(event) => setAcceptedLegal(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff003c]"
                required
              />
              <span>
                Accept{" "}
                <Link
                  href="/terms"
                  className="font-medium text-[#ff003c] hover:text-white"
                >
                  Termenii
                </Link>
                ,{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-[#ff003c] hover:text-white"
                >
                  Politica de confidentialitate
                </Link>{" "}
                si{" "}
                <Link
                  href="/cookies"
                  className="font-medium text-[#ff003c] hover:text-white"
                >
                  Politica cookies
                </Link>
                .
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ff003c] py-3.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(255,0,60,0.22)] transition-all hover:bg-[#d60032] disabled:bg-zinc-800"
          >
            <span>
              {loading
                ? "Se proceseaza..."
                : isResetRequest
                  ? "Trimite link de resetare"
                : isSignUp
                  ? "Creeaza cont"
                  : "Intra in aplicatie"}
            </span>
            <ArrowRight size={14} />
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsResetRequest(false);
            setIsSignUp(!isSignUp);
            setAcceptedLegal(false);
            setErrorMsg("");
            setInfoMsg("");
          }}
          className="mt-5 w-full text-center text-xs font-light text-zinc-500 transition-colors hover:text-zinc-300"
        >
          {isResetRequest
            ? "Inapoi la conectare"
            : isSignUp
            ? "Ai deja cont? Conecteaza-te"
            : "Nu ai cont? Inregistreaza-te gratuit"}
        </button>

        {!isSignUp && !isResetRequest && (
          <button
            type="button"
            onClick={() => {
              setIsResetRequest(true);
              setErrorMsg("");
              setInfoMsg("");
            }}
            className="mt-3 w-full text-center text-xs font-light text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Ai uitat parola?
          </button>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] text-zinc-600">
          <Link href="/privacy" className="hover:text-[#ff003c]">
            Confidentialitate
          </Link>
          <span>/</span>
          <Link href="/terms" className="hover:text-[#ff003c]">
            Termeni
          </Link>
          <span>/</span>
          <Link href="/cookies" className="hover:text-[#ff003c]">
            Cookies
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  rightElement = null,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </label>
      <div className="relative flex items-center">
        <Icon size={14} className="absolute left-4 text-zinc-500" />
        <input
          type={type}
          required
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-zinc-800 bg-[#161619] py-3 pl-11 text-xs font-light text-zinc-200 transition-all placeholder:text-zinc-600 focus:border-[#ff003c]/40 focus:outline-none ${
            rightElement ? "pr-12" : "pr-4"
          }`}
        />
        {rightElement && (
          <div className="absolute right-2 flex items-center">{rightElement}</div>
        )}
      </div>
    </div>
  );
}
