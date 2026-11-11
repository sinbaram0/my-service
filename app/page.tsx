import type { Metadata } from "next";
import Card from "@/components/Card";

export const metadata: Metadata = {
  title: "내 서비스",
  description: "바이브 코딩으로 만든 첫 서비스",
};

const features = [
  { title: "빠른 시작", description: "한 단계씩 시작해요" },
  { title: "쉬운 사용", description: "클릭 한 번이면 끝" },
  { title: "무료 제공", description: "비용 걱정 없이 시작" },
];

export default function Home() {
  return (
    <main
      lang="ko"
      className="flex min-h-svh flex-1 items-center bg-[#0a0a0a] px-6 py-20 font-sans text-zinc-100 sm:px-10 lg:px-16"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-3xl">
          <div aria-hidden="true" className="mb-8 h-1 w-12 bg-[#06b6d4]" />
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
            내 서비스<span className="text-[#06b6d4]" aria-hidden="true">.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-300 sm:text-2xl">
            바이브 코딩으로 만든 첫 서비스
          </p>
        </header>

        <section aria-label="서비스 특징" className="mt-16 grid grid-cols-1 gap-5 lg:mt-20 lg:grid-cols-3 lg:gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              title={feature.title}
              description={feature.description}
              number={index + 1}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
