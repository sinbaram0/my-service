async function weatherAt(latitude: number, longitude: number) {
  const apiKey = process.env.WEATHER_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: "날씨 서비스 설정이 필요합니다." }, { status: 503 });
  }

  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.search = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      units: "metric",
      lang: "kr",
      appid: apiKey,
    }).toString();

    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      return Response.json({ error: "날씨 정보를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
    }

    const data = await response.json();
    const temperature = data.main?.temp;
    const feelsLike = data.main?.feels_like;
    const humidity = data.main?.humidity;
    const windSpeed = data.wind?.speed;
    const description = data.weather?.[0]?.description;
    if (![temperature, feelsLike, humidity, windSpeed].every(value => typeof value === "number" && Number.isFinite(value)) || typeof description !== "string") {
      return Response.json({ error: "날씨 정보를 확인할 수 없습니다. 다시 시도해 주세요." }, { status: 502 });
    }

    return Response.json({ temperature, feelsLike, description, humidity, windSpeed }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    // Do not expose upstream URLs, credentials, or raw errors.
    return Response.json({ error: "날씨 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}


export async function GET() {
  return weatherAt(37.5665, 126.9780);
}

export async function POST(request: Request) {
  try {
    const { latitude, longitude } = await request.json();
    if (typeof latitude !== "number" || typeof longitude !== "number" ||
        !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return Response.json({ error: "올바른 위치 정보가 필요합니다." }, { status: 400 });
    }
    return weatherAt(latitude, longitude);
  } catch {
    return Response.json({ error: "올바른 위치 정보가 필요합니다." }, { status: 400 });
  }
}
