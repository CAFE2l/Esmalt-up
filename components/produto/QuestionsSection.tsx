"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { primaryButton } from "@/components/buttonStyles";

interface AnswerItem {
  id: string;
  content: string;
  userName: string;
  isVendor: boolean;
  helpfulCount: number;
  createdAt: string;
}

interface QuestionItem {
  id: string;
  content: string;
  userName: string;
  createdAt: string;
  answers: AnswerItem[];
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "dia" : "dias"} atrás`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function QuestionsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const { sessionId } = useCart();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", content: "" });
  const [message, setMessage] = useState<"ok" | "error" | null>(null);
  const [localHelpful, setLocalHelpful] = useState<Record<string, boolean>>({});
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/questions?productId=${encodeURIComponent(productId)}`);
      if (!response.ok) return;
      const data = (await response.json()) as {
        questions: QuestionItem[];
        answeredCount: number;
      };
      setQuestions(data.questions);
      setAnsweredCount(data.answeredCount);
      const counts: Record<string, number> = {};
      for (const question of data.questions) {
        for (const answer of question.answers) {
          counts[answer.id] = answer.helpfulCount;
        }
      }
      setLocalCounts(counts);
    } catch {
      /* mantém estado atual */
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleHelpful = async (answerId: string) => {
    if (localHelpful[answerId]) return;
    try {
      const token = user ? await user.getIdToken() : null;
      const response = await fetch(`/api/questions/${answerId}/helpful`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) return;
      const result = (await response.json()) as { helpful: boolean; delta: number };
      setLocalHelpful((current) => ({ ...current, [answerId]: result.helpful }));
      setLocalCounts((current) => ({
        ...current,
        [answerId]: Math.max(0, (current[answerId] ?? 0) + result.delta),
      }));
    } catch {
      /* falha silenciosa */
    }
  };

  const submitQuestion = async () => {
    if (form.content.trim().length < 5) return;
    setMessage(null);
    try {
      const token = await user?.getIdToken().catch(() => null);
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId,
          content: form.content.trim(),
          name: form.name.trim() || user?.displayName || "Cliente",
          email: form.email.trim() || undefined,
        }),
      });
      if (!response.ok) {
        setMessage("error");
        return;
      }
      setMessage("ok");
      setForm({ name: "", email: "", content: "" });
      setOpenForm(false);
    } catch {
      setMessage("error");
    }
  };

  return (
    <div className="rounded-[2rem] border border-cinza-suave/40 bg-branco p-7 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Perguntas & Respostas
          </h2>
          <p className="mt-1 text-sm text-foreground/60">
            {answeredCount > 0
              ? `${answeredCount} ${answeredCount === 1 ? "pergunta respondida" : "perguntas respondidas"}`
              : "Nenhuma pergunta respondida ainda"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setOpenForm((value) => !value);
          }}
          className={`${primaryButton} px-5 py-2.5 text-sm`}
        >
          {openForm ? "Fechar" : "Fazer uma pergunta"}
        </button>
      </div>

      {openForm && (
        <form
          className="mt-6 space-y-4 rounded-3xl border border-rose-gold/30 bg-rosa-claro/25 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitQuestion();
          }}
        >
          <textarea
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            placeholder="Escreva sua dúvida sobre este produto..."
            rows={3}
            maxLength={600}
            className="w-full resize-none rounded-3xl border border-cinza-suave/50 bg-branco px-4 py-3 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush"
          />
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder={user?.displayName ? `Nome (${user.displayName})` : "Seu nome"}
              className="min-w-0 flex-1 rounded-full border border-cinza-suave/50 bg-branco px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush"
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="E-mail p/ receber a resposta"
              className="min-w-0 flex-1 rounded-full border border-cinza-suave/50 bg-branco px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush"
            />
          </div>
          <p className="text-xs text-foreground/50">
            Você receberá um e-mail quando sua pergunta for respondida.
          </p>
          {message === "ok" && (
            <p className="text-sm text-emerald-400">Pergunta enviada! Acompanhe sua caixa de entrada.</p>
          )}
          {message === "error" && (
            <p className="text-sm text-red-400">Não foi possível enviar. Tente novamente.</p>
          )}
          <button type="submit" className={`${primaryButton} px-6 py-2.5 text-sm`}>
            Enviar pergunta
          </button>
        </form>
      )}

      {questions.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-rosa-claro/30 p-6 text-center text-sm text-foreground/60">
          Nenhuma pergunta ainda. Tire sua dúvida e ajude outras profissionais!
        </p>
      ) : (
        <ul className="mt-6 space-y-5">
          {questions.map((question) => (
            <li key={question.id} className="rounded-3xl border border-cinza-suave/30 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rosa-claro text-sm font-bold text-rose-gold">
                  ?
                </div>
                <div>
                  <p className="text-sm leading-relaxed text-foreground">{question.content}</p>
                  <p className="mt-1 text-xs text-foreground/50">
                    {question.userName} · {timeAgo(question.createdAt)}
                  </p>
                </div>
              </div>

              {question.answers.map((answer) => (
                <div
                  key={answer.id}
                  className="mt-4 rounded-2xl bg-rosa-claro/30 p-4 sm:ml-12"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-rosa-blush to-rose-gold text-[10px] font-bold text-white">
                      E
                    </span>
                    <span className="text-xs font-semibold text-rose-gold">
                      {answer.userName}
                    </span>
                    {answer.isVendor && (
                      <span className="rounded-full bg-rose-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-gold">
                        Equipe
                      </span>
                    )}
                    <span className="text-[11px] text-foreground/50">
                      · {timeAgo(answer.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    {answer.content}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleHelpful(answer.id)}
                    disabled={localHelpful[answer.id]}
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      localHelpful[answer.id]
                        ? "border-rose-gold/50 bg-rosa-blush/15 text-rose-gold"
                        : "border-cinza-suave/50 text-foreground/60 hover:text-rose-gold"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />
                    </svg>
                    {(localCounts[answer.id] ?? 0) > 0 && `${localCounts[answer.id]} `}
                    {localHelpful[answer.id] ? "Obrigado!" : "Ajudou"}
                  </button>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}