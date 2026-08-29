import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — Free PDF Tools, Pro Power",
  description: "Start free with generous daily limits. Upgrade to Pro for larger files and advanced tools, or Business for teams and API access.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "Everything you need for everyday documents.",
    features: [
      "All 42 core tools",
      "Up to 20 daily conversions",
      "Files up to 150 MB",
      "Local browser processing",
      "Community support",
    ],
    cta: { label: "Start free", href: "/tools" },
    highlight: false,
  },
  {
    name: "Pro",
    price: "$6",
    period: "/month",
    blurb: "For students and professionals who live in documents.",
    features: [
      "Unlimited conversions",
      "Files up to 2 GB",
      "Priority processing pipeline",
      "Permanent file history & re-download",
      "Batch operations & custom watermarks",
      "Email support within 24h",
    ],
    cta: { label: "Go Pro", href: "/signup" },
    highlight: true,
  },
  {
    name: "Business",
    price: "$18",
    period: "/user/mo",
    blurb: "Teams, automation and the PDFForge API.",
    features: [
      "Everything in Pro",
      "Team workspace & shared templates",
      "REST API with 50k calls/month",
      "Webhooks & usage analytics",
      "SSO / SAML ready",
      "Dedicated support engineer",
    ],
    cta: { label: "Contact sales", href: "/docs" },
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container-p py-16">
      <div className="mb-12 text-center">
        <p className="kicker">PRICING</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          Simple plans. <span className="gradient-text">Serious power.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">
          Start free — upgrade only when your documents outgrow it.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`card-p relative flex flex-col p-7 ${tier.highlight ? "border-brand-500 shadow-lift ring-2 ring-brand-500/30 lg:-translate-y-2" : ""}`}
          >
            {tier.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 px-4 py-1 text-xs font-bold text-white">
                MOST POPULAR
              </span>
            )}
            <h2 className="text-lg font-extrabold">{tier.name}</h2>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="text-4xl font-black tracking-tight">{tier.price}</span>
              <span className="text-sm text-slate-400">{tier.period}</span>
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{tier.blurb}</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={tier.cta.href}
              className={`${tier.highlight ? "btn-primary" : "btn-ghost"} mt-6 w-full py-3`}
            >
              {tier.cta.label}
            </Link>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <strong className="text-slate-700 dark:text-slate-200">Fair-use promise:</strong> free tools stay free forever.
        Local-first processing means we can keep prices low — your files never cost us server money.
      </div>
    </div>
  );
}
