"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Session = {
  id: string;
  status: string;
  amountZec: number;
  targetAction: { type: string; destination?: string };
  zcashTxId?: string;
  solanaTxId?: string;
  bridgerTransactionId?: string;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  sessions: Session[];
  nextCursor: string | null;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-400/20 text-amber-300",
  confirmed: "bg-cyan-400/20 text-cyan-200",
  executed: "bg-emerald-400/20 text-emerald-200",
  failed: "bg-rose-400/20 text-rose-200",
  expired: "bg-slate-500/20 text-slate-200",
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

export default function MerchantPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sseActive, setSseActive] = useState(false);

  const fetchSessions = useCallback(async (nextCursor?: string | null) => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (nextCursor) {
        query.set("cursor", nextCursor);
      }
      query.set("limit", "50");
      const response = await fetch(`/api/payments/list?${query.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load sessions");
      }
      const data = (await response.json()) as ListResponse;
      setSessions((prev) =>
        nextCursor ? [...prev, ...data.sessions] : data.sessions
      );
      setCursor(data.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const source = new EventSource("/api/payments/events");
    source.onopen = () => setSseActive(true);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          sessionId: string;
          payload?: Session;
        };
        if (!data.payload) {
          return;
        }
        const payload = data.payload;
        setSessions((prev) => {
          const next = [...prev];
          const index = next.findIndex((item) => item.id === data.sessionId);
          if (index === -1) {
            next.unshift(payload);
          } else {
            next[index] = payload;
          }
          return next.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
      } catch {
        return;
      }
    };
    source.onerror = () => {
      setSseActive(false);
      source.close();
    };
    return () => source.close();
  }, []);

  useEffect(() => {
    if (sseActive) {
      return;
    }
    const interval = setInterval(() => fetchSessions(), 10000);
    return () => clearInterval(interval);
  }, [fetchSessions, sseActive]);

  const exportCsv = () => {
    if (sessions.length === 0) return;
    const header = [
      "id",
      "status",
      "amountZec",
      "targetType",
      "destination",
      "zcashTxId",
      "solanaTxId",
      "bridgerTransactionId",
      "createdAt",
      "updatedAt",
    ];
    const rows = sessions.map((session) => [
      session.id,
      session.status,
      session.amountZec,
      session.targetAction?.type ?? "",
      session.targetAction?.destination ?? "",
      session.zcashTxId ?? "",
      session.solanaTxId ?? "",
      session.bridgerTransactionId ?? "",
      session.createdAt,
      session.updatedAt,
    ]);
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zpay-sessions-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const totalVolume = useMemo(
    () => sessions.reduce((sum, session) => sum + session.amountZec, 0),
    [sessions]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
              Merchant Console
            </p>
            <h1 className="text-3xl font-semibold">Payment Sessions Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchSessions()}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Refresh
            </button>
            <button
              onClick={exportCsv}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white/90 disabled:bg-white/20 disabled:text-white/50"
              disabled={sessions.length === 0}
            >
              Export CSV
            </button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">
              Sessions
            </div>
            <div className="mt-3 text-3xl font-semibold">{sessions.length}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">
              Total ZEC Volume
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {totalVolume.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">
              Last Updated
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {sessions[0] ? formatTimestamp(sessions[0].updatedAt) : "—"}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            <button
              onClick={() => fetchSessions(cursor ?? undefined)}
              disabled={!cursor || isLoading}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold transition hover:border-white hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
            >
              {isLoading ? "Loading..." : cursor ? "Load More" : "End of List"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-white/60">
                <tr>
                  <th className="whitespace-nowrap pb-3 pr-6">Session</th>
                  <th className="pb-3 pr-6">Status</th>
                  <th className="pb-3 pr-6">ZEC</th>
                  <th className="pb-3 pr-6">Destination</th>
                  <th className="pb-3 pr-6">Zcash Tx</th>
                  <th className="pb-3 pr-6">Solana Tx</th>
                  <th className="pb-3 pr-6">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {sessions.map((session) => {
                  const chipClass =
                    statusColors[session.status] ?? "bg-white/10 text-white/70";
                  return (
                    <tr key={session.id}>
                      <td className="max-w-[180px] truncate py-4 pr-6 font-mono text-[11px] text-white/80">
                        {session.id}
                      </td>
                      <td className="py-4 pr-6">
                        <span className={`rounded-full px-3 py-1 text-[11px] ${chipClass}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="py-4 pr-6 text-white/80">
                        {session.amountZec.toFixed(2)}
                      </td>
                      <td className="max-w-[160px] truncate py-4 pr-6 font-mono text-[11px] text-white/60">
                        {session.targetAction?.destination ?? "—"}
                      </td>
                      <td className="max-w-[140px] truncate py-4 pr-6 text-emerald-200">
                        {session.zcashTxId ? (
                          <a
                            href={`https://zcashblockexplorer.com/tx/${session.zcashTxId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                          >
                            {session.zcashTxId}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[140px] truncate py-4 pr-6 text-emerald-200">
                        {session.solanaTxId ? (
                          <a
                            href={`https://solscan.io/tx/${session.solanaTxId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                          >
                            {session.solanaTxId}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-4 pr-6 text-white/60">
                        {formatTimestamp(session.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-white/50">
                      No sessions yet. Generate one from the checkout demo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

