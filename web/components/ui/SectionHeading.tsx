import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tightest text-white sm:text-[2.6rem] sm:leading-[1.05]">
        {title}
      </h2>
      {subtitle && <p className="mt-5 text-lg leading-relaxed text-white/55">{subtitle}</p>}
    </Reveal>
  );
}
