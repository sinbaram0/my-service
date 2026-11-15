"use client";

import { useEffect, useState } from "react";
import styles from "./weather.module.css";
import CurrentLocationWeather from "@/components/CurrentLocationWeather";

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
          <p className={styles.eyebrow}>WEATHER</p>
          <h1>지금 날씨</h1>
          <p className={styles.subtitle}>오늘의 공기, 외출 전 한눈에 확인하세요.</p>

        </header>

        <div className={styles.weatherRows}>
        <section className={styles.weatherRow} aria-labelledby="seoul-weather-title" aria-busy={loading}>
          <h2 id="seoul-weather-title" className={styles.rowLabel}>서울</h2>
          {loading ? (
            <div className={styles.message} role="status"><span className={styles.loader} />서울 날씨를 불러오는 중입니다…</div>
          ) : error ? (
            <div className={styles.message} role="alert">
              <p>{error}</p>
              <button className={styles.retry} onClick={() => setAttempt(value => value + 1)}>다시 불러오기</button>
            </div>
          ) : weather ? (
            <div className={styles.readings}>
              <strong className={styles.rowTemperature}>{weather.temperature.toFixed(1)} °C</strong>
              <span>{weather.description}</span>
              <span>체감 {weather.feelsLike.toFixed(1)} °C</span>
              <span>습도 {weather.humidity}%</span>
              <span>풍속 {weather.windSpeed.toFixed(1)} m/s</span>
            </div>
          ) : null}
        </section>
        <CurrentLocationWeather />
        </div>
        <footer className={styles.footer}>날씨 데이터 제공: OpenWeatherMap · 서울 및 기기 위치 기준</footer>
      </div>
    </main>
  );
}
