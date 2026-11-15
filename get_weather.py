"""Fetch Seoul weather using the same OpenWeather settings as /api/weather."""

import html
import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen


class WeatherError(Exception):
    """A safe error message that never contains the API key or request URL."""


def fetch_weather(api_key):
    params = urlencode({
        "lat": "37.5665", "lon": "126.9780",
        "units": "metric", "lang": "kr", "appid": api_key,
    })
    try:
        with urlopen(
            "https://api.openweathermap.org/data/2.5/weather?" + params,
            timeout=10,
        ) as response:
            data = json.load(response)
    except HTTPError as exc:
        if exc.code == 401:
            raise WeatherError("OpenWeather API 키가 올바르지 않거나 아직 활성화되지 않았습니다.") from None
        if exc.code == 429:
            raise WeatherError("OpenWeather API 호출 한도를 초과했습니다.") from None
        raise WeatherError(f"OpenWeather 요청에 실패했습니다. HTTP 상태: {exc.code}") from None
    except (URLError, TimeoutError, OSError):
        raise WeatherError("날씨 서비스 연결에 실패했습니다. 네트워크 상태를 확인해 주세요.") from None
    except (ValueError, UnicodeError):
        raise WeatherError("날씨 서비스가 올바른 JSON을 반환하지 않았습니다.") from None

    try:
        weather = {
            "temperature": data["main"]["temp"],
            "feelsLike": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "windSpeed": data["wind"]["speed"],
            "description": data["weather"][0]["description"],
        }
        for field in ("temperature", "feelsLike", "humidity", "windSpeed"):
            value = weather[field]
            if type(value) not in (int, float) or not math.isfinite(value):
                raise ValueError
        if not isinstance(weather["description"], str) or not weather["description"].strip():
            raise ValueError
        # Only display a single line of provider text; never echo a credential.
        weather["description"] = " ".join(weather["description"].split()).replace(api_key, "[숨김]")
        return weather
    except (KeyError, IndexError, TypeError, ValueError, OverflowError):
        raise WeatherError("날씨 응답에 필요한 값이 없거나 올바르지 않습니다.") from None


def write_summary(text):
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary:
            summary.write(text + "\n")


def main():
    try:
        api_key = os.environ.get("WEATHER_API_KEY", "").strip()
        if not api_key:
            raise WeatherError("GitHub Actions Secret WEATHER_API_KEY를 등록해 주세요.")
        weather = fetch_weather(api_key)
        checked_at = datetime.now(timezone(timedelta(hours=9))).strftime("%Y-%m-%d %H:%M:%S KST")
        rows = [
            ("조회 시각", checked_at),
            ("현재 온도", f"{weather['temperature']:.1f} °C"),
            ("체감 온도", f"{weather['feelsLike']:.1f} °C"),
            ("날씨", weather["description"]),
            ("습도", f"{weather['humidity']:g} %"),
            ("풍속", f"{weather['windSpeed']:.1f} m/s"),
        ]
        print("서울 현재 날씨 · OpenWeatherMap")
        for label, value in rows:
            print(f"{label}: {value}")
        lines = ["## 서울 현재 날씨", "", "| 항목 | 결과 |", "| --- | --- |"]
        for label, value in rows:
            safe_value = html.escape(value).replace("|", "&#124;")
            lines.append(f"| {label} | {safe_value} |")
        lines.extend(["", "데이터 제공: OpenWeatherMap · 조회 시점의 현재 날씨입니다."])
        write_summary("\n".join(lines))
        return 0
    except WeatherError as exc:
        message = str(exc)
        print("날씨 조회 실패: " + message, file=sys.stderr)
        try:
            write_summary("## 날씨 조회 실패\n\n" + message)
        except OSError:
            print("Actions 요약 파일을 기록하지 못했습니다.", file=sys.stderr)
        return 1
    except OSError:
        print("Actions 요약 파일을 기록하지 못했습니다.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
