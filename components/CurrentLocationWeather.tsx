"use client";

import { useEffect, useState } from "react";
import styles from "@/app/weather/weather.module.css";

type Weather = { temperature: number; feelsLike: number; description: string; humidity: number; windSpeed: number };

export default function CurrentLocationWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [message, setMessage] = useState("위치 권한을 허용하면 현재 위치의 날씨를 확인할 수 있습니다.");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fail = (text: string) => {
      if (controller.signal.aborted) return;
      setMessage(text);
      setLoading(false);
    };
    if (!window.isSecureContext || !navigator.geolocation) {
      fail(!window.isSecureContext
        ? "현재 위치 조회는 HTTPS 또는 localhost에서 사용할 수 있습니다."
        : "이 브라우저는 위치 조회를 지원하지 않습니다.");
      return () => controller.abort();
    }
    navigator.geolocation.getCurrentPosition(async position => {
      if (controller.signal.aborted) return;
      setMessage("현재 위치의 날씨를 불러오는 중입니다…");
      try {
        const response = await fetch("/api/weather", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("Weather unavailable");
        const data: Weather = await response.json();
        if (![data.temperature, data.feelsLike, data.humidity, data.windSpeed]
          .every(value => typeof value === "number" && Number.isFinite(value)) ||
          typeof data.description !== "string") throw new Error("Invalid weather");
        if (!controller.signal.aborted) { setWeather(data); setLoading(false); }
      } catch { fail("현재 위치 날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."); }
    }, error => {
      fail(error.code === 1
        ? "위치 권한이 꺼져 있습니다. 브라우저의 사이트 설정에서 위치를 허용한 뒤 다시 시도해 주세요."
        : error.code === 3
          ? "위치 확인 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
          : "현재 위치를 찾지 못했습니다. 기기의 위치 서비스를 확인해 주세요.");
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    setWeather(null); setLoading(true); setMessage("현재 위치를 확인하는 중입니다…");
    setAttempt(value => value + 1);
  };

  return (
    <section className={styles.weatherRow} aria-labelledby="current-location-title" aria-busy={loading}>
      <h2 id="current-location-title" className={styles.rowLabel} aria-live="polite">현재 위치</h2>
      <div className={styles.locationContent}>
        {weather ? (
          <div className={styles.readings}>
            <strong className={styles.rowTemperature}>{weather.temperature.toFixed(1)} °C</strong>
            <span>{weather.description}</span>
            <span>체감 {weather.feelsLike.toFixed(1)} °C</span>
            <span>습도 {weather.humidity}%</span>
            <span>풍속 {weather.windSpeed.toFixed(1)} m/s</span>
          </div>
        ) : (
          <p className={styles.rowMessage} role="status" aria-live="polite">{message}</p>
        )}
        <button className={styles.retry} onClick={retry} disabled={loading}>현재 위치 다시 확인</button>
        <p className={styles.locationNotice}>위치 권한 허용 시 좌표를 OpenWeatherMap에 전달해 날씨를 조회합니다. 이 웹사이트는 좌표를 별도로 저장하지 않습니다.</p>
      </div>
    </section>
  );
}
