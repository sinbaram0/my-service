"use client";

import { useEffect, useState } from "react";
import styles from "./weather.module.css";

type Weather = {
  temperature: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
};

export default function WeatherPage() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/weather", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("weather request failed");
        const data: Weather = await response.json();
        if (!controller.signal.aborted) setWeather(data);
      } catch {
        if (!controller.signal.aborted) setError("날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  return (
    <main className={styles.page} lang="ko">
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>SEOUL WEATHER</p>
          <h1>서울의 지금 날씨</h1>
          <p className={styles.subtitle}>오늘의 공기, 외출 전 한눈에 확인하세요.</p>
          <span className={styles.location}>서울 · 대한민국</span>
        </header>

        <section aria-label="서울 현재 날씨" aria-busy={loading}>
          {loading ? (
            <div className={styles.message} role="status"><span className={styles.loader} />서울 날씨를 불러오는 중입니다…</div>
          ) : error ? (
            <div className={styles.message} role="alert">
              <p>{error}</p>
              <button className={styles.retry} onClick={() => setAttempt(value => value + 1)}>다시 불러오기</button>
            </div>
          ) : weather ? (
            <div className={styles.grid}>
              <article className={`${styles.card} ${styles.temperature}`}>
                <h2>현재 온도</h2>
                <p className={styles.bigValue}>{weather.temperature.toFixed(1)}<span>°C</span></p>
                <p className={styles.note}>서울의 현재 기온</p>
              </article>
              <article className={styles.card}><h2>체감 온도</h2><p className={styles.value}>{weather.feelsLike.toFixed(1)}<span>°C</span></p></article>
              <article className={styles.card}><h2>날씨</h2><p className={`${styles.value} ${styles.description}`}>{weather.description}</p></article>
              <article className={styles.card}><h2>습도</h2><p className={styles.value}>{weather.humidity}<span>%</span></p></article>
              <article className={styles.card}><h2>바람 속도</h2><p className={styles.value}>{weather.windSpeed.toFixed(1)}<span>m/s</span></p></article>
            </div>
          ) : null}
        </section>
        <footer className={styles.footer}>날씨 데이터 제공: OpenWeatherMap · 서울 기준</footer>
      </div>
    </main>
  );
}
