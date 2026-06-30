import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Playground", href: "/playground" },
      { label: "How it works", href: "/#how" },
      { label: "API", href: "/#api" },
    ],
  },
  {
    title: "Security",
    links: [
      { label: "Isolation model", href: "/#security" },
      { label: "Resource limits", href: "/#security" },
      { label: "Defense in depth", href: "/#security" },
    ],
  },
  {
    title: "Runtimes",
    links: [
      { label: "Python 3.12", href: "/playground" },
      { label: "Node.js 20", href: "/playground" },
      { label: "Go 1.22", href: "/playground" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={logo} alt="AI-Code-Sandbox" className="h-7 w-7 rounded-md" />
            <span className="text-[15px] font-semibold tracking-tightest text-white">
              AI-Code-Sandbox
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
            Secure, ephemeral code execution infrastructure for the GenAI era.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-medium text-white/80">{col.title}</h3>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/45 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-hairline">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} AI-Code-Sandbox. MIT licensed.
          </p>
          <p className="font-mono text-xs text-white/30">
            Containers · Namespaces · cgroups
          </p>
        </div>
      </div>
    </footer>
  );
}
