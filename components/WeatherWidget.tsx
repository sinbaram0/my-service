"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Weather = { temperature: number; description: string };

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/weather", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Weather unavailable");
        const data: Weather = await response.json();
        if (!Number.isFinite(data.temperature) || typeof data.description !== "string") throw new Error("Invalid weather");
        if (!controller.signal.aborted) setWeather(data);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return (
    <Link href="/weather" aria-label="서울 현재 날씨, 상세 보기" className="flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm transition-colors hover:border-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400">
      <span className="text-zinc-400">서울</span>
      <span aria-live="polite" className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {weather ? <><strong className="text-lg font-semibold text-cyan-300">{weather.temperature.toFixed(1)}°C</strong><span className="text-zinc-300">{weather.description}</span></> : <span className="text-xs text-zinc-400">{failed ? "날씨 확인하기 ↗" : "날씨 불러오는 중…"}</span>}
      </span>
      <span aria-hidden="true" className="text-zinc-500">↗</span>
    </Link>
  );
}
