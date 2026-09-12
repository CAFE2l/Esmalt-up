"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { primaryButton, outlineButton } from "./buttonStyles";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

const authErrors: Record<string, string> = {
  "auth/invalid-email": "Digite um e-mail válido.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/user-not-found": "Não encontramos uma conta com este e-mail.",
  "auth/wrong-password": "Senha incorreta. Tente novamente.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Este e-mail já está cadastrado. Faça login.",
  "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
  "auth/missing-password": "Digite uma senha.",
  "auth/popup-closed-by-user": "Janela do Google fechada antes do login.",
  "auth/account-exists-with-different-credential":
    "Este e-mail já está vinculado a outra forma de login.",
  "auth/network-request-failed":
    "Falha de conexão. Verifique sua internet e tente novamente.",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && "code" in error) {
    const code = (error as { code: string }).code;
    return authErrors[code] ?? "Algo deu errado. Tente novamente.";
  }
  return "Algo deu errado. Tente novamente.";
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.56-5.17 3.56-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.72-4.96H1.27v3.1A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12.01 12.01 0 0 0 0 10.76l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4.01 3.1c.94-2.85 3.59-4.96 6.72-4.96z"
      />
    </svg>
  );
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login, signup, loginWithGoogle } = useAuth();

  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await signup(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputClasses =
    "w-full rounded-2xl border border-cinza-suave bg-rosa-claro/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:border-rose-gold focus:outline-none";

  return (
    <div className="w-full max-w-md rounded-3xl border border-cinza-suave/70 bg-branco p-8 shadow-card">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {isSignup ? "Criar conta" : "Bem-vinda de volta"}
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          {isSignup
            ? "Crie sua conta para acompanhar pedidos e o curso."
            : "Acesse sua conta para acompanhar pedidos e o curso."}
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className={`${outlineButton} mt-6 w-full px-6 py-3 text-sm`}
      >
        <GoogleIcon />
        <span className="ml-2">
          {googleLoading
            ? "Conectando..."
            : isSignup
              ? "Criar conta com o Google"
              : "Entrar com o Google"}
        </span>
      </button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-cinza-suave/70" />
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/50">
          ou
        </span>
        <span className="h-px flex-1 bg-cinza-suave/70" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignup && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground/80">
              Nome
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              className={inputClasses}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground/80">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/80">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isSignup ? "Mínimo de 6 caracteres" : "Sua senha"}
            className={inputClasses}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-rosa-medio/50 bg-rosa-claro px-4 py-3 text-sm text-rosa-blush"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className={`${primaryButton} w-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {loading
            ? "Carregando..."
            : isSignup
              ? "Criar conta"
              : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/70">
        {isSignup ? (
          <>
            Já tem uma conta?{" "}
            <Link href="/login" className="font-semibold text-rose-gold transition-colors hover:text-rosa-blush">
              Entrar
            </Link>
          </>
        ) : (
          <>
            Ainda não tem conta?{" "}
            <Link href="/signup" className="font-semibold text-rose-gold transition-colors hover:text-rosa-blush">
              Criar conta
            </Link>
          </>
        )}
      </p>
    </div>
  );
}