type CardProps = {
  title: string;
  description: string;
  number: number;
};

export default function Card({ title, description, number }: CardProps) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7 sm:p-9">
      <span aria-hidden="true" className="font-mono text-sm text-[#06b6d4]">
        {String(number).padStart(2, "0")}
      </span>
      <h2 className="mt-8 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-zinc-400">
        {description}
      </p>
    </article>
  );
}
