import Link from "next/link";

const features = [
  {
    title: "Private by Default",
    description:
      "Shielded Zcash deposits flow straight into Solana actions without exposing sender identity.",
  },
  {
    title: "Programmable Settlements",
    description:
      "Trigger SOL transfers, token swaps, or program invocations once payments confirm on-chain.",
  },
  {
    title: "Merchant Ready",
    description:
      "Dashboard visibility, status webhooks, and export tools keep ops teams informed in real time.",
  },
];

const timeline = [
  {
    title: "MVP Launch",
    detail: "Zcash payment detection, Flashift-powered SOL execution, live checkout UI, merchant log view.",
  },
  {
    title: "Realtime Signals",
    detail: "Upstash Kafka fan-out, webhook subscriptions, programmable merchant automations.",
  },
  {
    title: "Trust-Minimized Futures",
    detail: "Bridge research with RenVM and Zolana, hybrid custody, hardened API auth.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="text-xl font-semibold tracking-tight">ZPay</div>
          <nav className="flex items-center gap-6 text-sm text-white/70">
            <Link href="/payments/checkout" className="transition hover:text-white">
              Checkout Demo
            </Link>
            <Link href="/merchant" className="transition hover:text-white">
              Merchant Console
            </Link>
            <Link href="https://docs.flashift.app/" target="_blank" className="transition hover:text-white">
              Flashift Docs
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-6 py-20">
        <section className="grid gap-12 md:grid-cols-[1.2fr,0.8fr] md:items-center">
          <div className="space-y-8">
            <p className="inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
              Zcash ↔ Solana Bridge
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Private payments meet programmable liquidity.
            </h1>
            <p className="text-lg text-white/70">
              ZPay unifies Zcash privacy with Solana speed. Accept shielded ZEC, settle with smart
              contract actions, and prove everything with auditable hashes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/payments/checkout"
                className="rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-white/90"
              >
                Launch Checkout
              </Link>
              <Link
                href="/merchant"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:border-white hover:bg-white/10"
              >
                View Dashboard
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_-40px_rgba(15,118,110,0.8)]">
            <div className="space-y-4">
              <div className="text-sm uppercase tracking-[0.3em] text-emerald-300">
                Payment Flow
              </div>
              <div className="space-y-3 text-sm text-white/70">
                <p>
                  1. Merchant creates a payment session via AWS Amplify edge API backed by Upstash Redis.
                </p>
                <p>2. Zcash watchdog confirms shielded transfer via lightwalletd.</p>
                <p>
                  3. Flashift executes the SOL delivery to the destination address, completing the loop.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-10 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="mb-3 text-xl font-semibold">{feature.title}</h2>
              <p className="text-sm leading-6 text-white/70">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/10 via-slate-900 to-slate-950 p-10">
          <div className="mb-8 text-xs uppercase tracking-[0.3em] text-emerald-200">
            Delivery Roadmap
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {timeline.map((stage) => (
              <div key={stage.title} className="space-y-3">
                <div className="text-sm font-medium text-emerald-200">{stage.title}</div>
                <p className="text-sm text-white/70">{stage.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
