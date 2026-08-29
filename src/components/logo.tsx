export function Logo({ size = "md" }: { size?: "md" | "sm" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${size === "md" ? "text-xl" : "text-base"}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 text-sm font-black text-white shadow-lg shadow-brand-500/30">
        PF
      </span>
      PDF<span className="gradient-text">Forge</span>
    </span>
  );
}
