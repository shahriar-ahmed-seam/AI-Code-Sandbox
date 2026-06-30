const ITEMS = [
  "network = none",
  "read-only rootfs",
  "cgroup limits",
  "CapDrop ALL",
  "no-new-privileges",
  "ephemeral containers",
  "Python",
  "Node.js",
  "Go",
  "instant cleanup",
  "rate limited",
  "non-root",
];

export function Marquee() {
  return (
    <div className="mask-fade-x relative overflow-hidden border-y border-hairline py-5">
      <div className="flex w-max animate-marquee items-center gap-10">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            <span className="font-mono text-sm tracking-tight text-white/40">{item}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
          </span>
        ))}
      </div>
    </div>
  );
}
