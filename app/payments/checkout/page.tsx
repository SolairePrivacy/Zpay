"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Session = {
  id: string;
  zcashAddress: string;
  amountZec: number;
  status: string;
  zcashTxId?: string;
  solanaTxId?: string;
  flashiftTransactionId?: string;
  flashiftDepositAddress?: string;
  createdAt: string;
  updatedAt: string;
  errorReason?: string;
};

const statusLabels: Record<string, string> = {
  pending: "Awaiting Zcash deposit",
  confirmed: "Zcash confirmed, executing Flashift swap",
  executed: "Solana transaction completed",
  expired: "Session expired",
  failed: "Execution failed",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function lamportsFromSol(solAmount: number) {
  return Math.round(solAmount * 1_000_000_000);
}

export default function CheckoutPage() {
  const [amountZec, setAmountZec] = useState("1.0");
  const [solAmount, setSolAmount] = useState("0.4");
  const [destination, setDestination] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sseActive, setSseActive] = useState(false);

  const canSubmit = useMemo(() => {
    const amount = Number(amountZec);
    const sol = Number(solAmount);
    return (
      !isLoading &&
      destination.length > 0 &&
      Number.isFinite(amount) &&
      amount > 0 &&
      Number.isFinite(sol) &&
      sol > 0
    );
  }, [amountZec, destination.length, isLoading, solAmount]);

  const createSession = useCallback(async () => {
    const zec = Number(amountZec);
    const sol = Number(solAmount);
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amountZec: zec,
          targetAction: {
            type: "send_sol",
            destination,
            lamports: lamportsFromSol(sol),
          },
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? "Failed to create session");
      }
      const created = (await response.json()) as Session;
      setSession(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [amountZec, canSubmit, destination, solAmount]);

  useEffect(() => {
    if (!session?.zcashAddress) {
      setQr(null);
      return;
    }
    let cancelled = false;

    const generateQr = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(session.zcashAddress, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 256,
        });
        if (!cancelled) {
          setQr(dataUrl);
        }
      } catch {
        if (!cancelled) {
          setQr(null);
        }
      }
    };

    void generateQr();
    return () => {
      cancelled = true;
    };
  }, [session?.zcashAddress]);

  useEffect(() => {
    if (!session) return;

    const source = new EventSource("/api/payments/events");

    source.onopen = () => {
      setSseActive(true);
    };

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          sessionId: string;
          payload?: Session;
        };
        if (!data || data.sessionId !== session.id || !data.payload) {
          return;
        }

        setSession(data.payload);
      } catch {
        return;
      }
    };

    source.onerror = () => {
      setSseActive(false);
      source.close();
    };

    return () => {
      source.close();
    };
  }, [session]);

  useEffect(() => {
    if (!session || sseActive) {
      return;
    }
    if (session.status === "executed" || session.status === "expired" || session.status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/status/${session.id}`);
        if (!response.ok) {
          return;
        }
        const updated = (await response.json()) as Session;
        setSession(updated);
      } catch {
        return;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [session, sseActive]);

  const status = session ? statusLabels[session.status] ?? session.status : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Checkout</p>
          <h1 className="text-3xl font-semibold">Pay with Zcash, settle on Solana</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Generate a session, deposit shielded ZEC, and watch Flashift trigger your Solana transfer
            as soon as confirmations land.
          </p>
        </header>

        <section className="grid gap-10 md:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/60">
                  ZEC Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountZec}
                  onChange={(event) => setAmountZec(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm focus:border-emerald-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/60">
                  SOL Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={solAmount}
                  onChange={(event) => setSolAmount(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm focus:border-emerald-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/60">
                  Destination SOL Address
                </label>
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Enter destination wallet"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm focus:border-emerald-300 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={createSession}
                disabled={!canSubmit}
                className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/60"
              >
                {isLoading ? "Creating Session..." : "Generate Payment Session"}
              </button>
              {error && <p className="text-sm text-rose-300">{error}</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-8">
            {!session && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="text-sm text-white/70">Session details will appear here once generated.</p>
              </div>
            )}
            {session && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  {qr && (
                    <img
                      src={qr}
                      alt="Zcash payment QR"
                      className="h-48 w-48 rounded-2xl border border-white/10 bg-white/10 p-3"
                    />
                  )}
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-white/60">Session ID</div>
                      <div className="break-all font-mono text-xs text-white/80">{session.id}</div>
                    </div>
                    <div>
                      <div className="text-white/60">Zcash Address</div>
                      <div className="break-all font-mono text-xs text-emerald-200">
                        {session.zcashAddress}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60">Status</div>
                      <div className="text-sm font-medium text-emerald-200">{status}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-white/70">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span>{formatDate(session.updatedAt)}</span>
                  </div>
                  {session.zcashTxId && (
                    <div className="break-all">
                      <div className="text-white/60">Zcash Tx</div>
                      <a
                        href={`https://zcashblockexplorer.com/tx/${session.zcashTxId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-200 underline underline-offset-2"
                      >
                        {session.zcashTxId}
                      </a>
                    </div>
                  )}
                  {session.solanaTxId && (
                    <div className="break-all">
                      <div className="text-white/60">Solana Tx</div>
                      <a
                        href={`https://solscan.io/tx/${session.solanaTxId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-200 underline underline-offset-2"
                      >
                        {session.solanaTxId}
                      </a>
                    </div>
                  )}
                  {session.flashiftTransactionId && (
                    <div className="break-all">
                      <div className="text-white/60">Flashift Order</div>
                      <div className="font-mono text-emerald-200">{session.flashiftTransactionId}</div>
                    </div>
                  )}
                  {session.flashiftDepositAddress && (
                    <div className="break-all">
                      <div className="text-white/60">Flashift Deposit Address</div>
                      <div className="font-mono text-emerald-200">{session.flashiftDepositAddress}</div>
                    </div>
                  )}
                  {session.status === "failed" && (
                    <div className="text-rose-300">
                      {session.errorReason
                        ? `Failure: ${session.errorReason}`
                        : "Reach out to support to retry this payment."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

