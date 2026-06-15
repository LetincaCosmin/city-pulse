"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Lock } from "lucide-react";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const passwordValidation = passwordChecks.map((check) => ({
    ...check,
    isValid: check.test(password),
  }));
  const isPasswordStrong = passwordValidation.every((check) => check.isValid);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setHasSession(Boolean(session));
      setCheckingSession(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(Boolean(session));
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    try {
      if (!hasSession) {
        throw new Error("Linkul de resetare nu este valid sau a expirat.");
      }

      if (!isPasswordStrong) {
        throw new Error(
          "Parola trebuie sa aiba minim 8 caractere, litere mari si mici, un numar si un simbol.",
        );
      }

      if (password !== confirmPassword) {
        throw new Error("Parolele nu coincid.");
      }

      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      await supabase.auth.signOut();
      setInfoMsg("Parola a fost schimbata.");
      setTimeout(() => {
        router.push("/login?passwordReset=1");
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || "Nu am putut schimba parola.");
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
            Seteaza o parola noua
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

        {checkingSession ? (
          <p className="text-center text-xs text-zinc-500">
            Verificam linkul de resetare...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!hasSession && (
              <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4 text-center text-xs leading-relaxed text-zinc-500">
                Linkul de resetare nu este valid sau a expirat. Cere un link
                nou din pagina de conectare.
              </div>
            )}

            <Field
              icon={Lock}
              label="Parola noua"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Minim 8 caractere"
              disabled={!hasSession}
            />

            <Field
              icon={Lock}
              label="Confirma parola"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeta parola"
              disabled={!hasSession}
            />

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

            <button
              type="submit"
              disabled={loading || !hasSession}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ff003c] py-3.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(255,0,60,0.22)] transition-all hover:bg-[#d60032] disabled:bg-zinc-800"
            >
              <span>{loading ? "Se salveaza..." : "Schimba parola"}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-5 block w-full text-center text-xs font-light text-zinc-500 transition-colors hover:text-zinc-300"
        >
          Inapoi la conectare
        </Link>
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
  disabled = false,
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
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-[#161619] py-3 pl-11 pr-4 text-xs font-light text-zinc-200 transition-all placeholder:text-zinc-600 focus:border-[#ff003c]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
}
