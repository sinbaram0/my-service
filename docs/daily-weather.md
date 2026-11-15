# 매일 서울 날씨 조회하기

이 자동화는 내 컴퓨터 대신 GitHub 서버에서 실행됩니다. 컴퓨터와 로컬 웹사이트가 꺼져 있어도 됩니다.
기존 `/api/weather`와 같은 OpenWeatherMap API, 서울 좌표(37.5665, 126.9780), 섭씨, 한국어 설정을 사용합니다.
웹사이트 서버를 호출하거나 웹사이트에 결과를 저장하지 않습니다.

## 파일별 역할

- `get_weather.py`: API 키를 환경변수에서 읽고 서울 현재 날씨를 조회합니다. 온도·체감온도·날씨 설명·습도·풍속을 검사한 뒤 로그와 Actions 요약에 표시합니다. Python 기본 라이브러리만 사용하므로 pip 설치는 필요 없습니다.
- `.github/workflows/daily-weather.yml`: 언제, 어디에서, 어떤 순서로 Python을 실행할지 GitHub에 알려줍니다.
- `docs/daily-weather.md`: 최초 설정과 실행 결과를 확인하는 안내서입니다.

## 최초 설정

1. GitHub 저장소에서 **Settings → Secrets and variables → Actions**를 엽니다.
2. **New repository secret**을 누릅니다.
3. 이름은 `WEATHER_API_KEY`, 값은 기존 날씨 기능에 사용하는 OpenWeatherMap API 키로 등록합니다.
4. 위 파일들을 기본 브랜치인 `main`에 커밋하고 푸시합니다. 로컬 파일만 만들면 GitHub에서는 실행되지 않습니다.

Vercel 환경변수나 로컬 `.env.local`은 GitHub Actions로 자동 복사되지 않습니다.
키를 코드·문서·채팅·로그에 붙여 넣지 마세요. 이 스크립트는 `.env.local`을 자동으로 읽지 않습니다.

## 실행 순서

1. 매일 한국 시간 오전 9시 10분에 실행 요청이 생성됩니다. `10 0 * * *`는 UTC 오전 0시 10분입니다.
2. GitHub가 Ubuntu 실행 환경을 준비합니다.
3. checkout 액션이 저장소 파일을 가져오고 setup-python 액션이 Python 3.13을 준비합니다.
4. GitHub Secret을 `WEATHER_API_KEY` 환경변수로 전달하고 `python get_weather.py`를 실행합니다.
5. Python이 서울 날씨를 조회하여 로그와 실행 요약(Summary)에 표시합니다.

GitHub 부하에 따라 시작이 늦어지거나 실행이 누락될 수 있어 정확한 시각을 보장하지 않습니다.
예약 실행은 기본 브랜치의 파일을 사용합니다. 공개 저장소는 활동이 60일간 없으면 예약이 비활성화될 수 있습니다.

## 버튼으로 실행하기

1. 저장소의 **Actions** 탭을 엽니다.
2. **Daily Seoul Weather**를 선택합니다.
3. **Run workflow**에서 `main`을 선택하고 실행합니다.
4. 생성된 실행을 열면 **Summary**에서 결과를 확인할 수 있습니다.
5. **weather → Fetch Seoul weather**를 열면 상세 로그를 확인할 수 있습니다.

버튼을 표시하려면 워크플로 파일이 기본 브랜치에 올라가 있어야 합니다.
결과는 실행 당시의 현재 날씨이며 일기예보가 아닙니다. 별도 알림 전송이나 결과 자동 커밋은 하지 않습니다.

## 오류가 날 때

- `WEATHER_API_KEY` 등록 안내: Secret 이름과 등록 여부를 확인합니다.
- HTTP 401: 키가 올바른지, 활성화됐는지 확인합니다.
- HTTP 429: OpenWeatherMap 호출 한도를 확인한 뒤 나중에 수동 실행합니다.
- 연결 실패: API 장애나 네트워크 문제인지 확인한 뒤 다시 실행합니다.
- 응답 검증 실패: OpenWeatherMap 응답에 필요한 데이터가 있는지 확인합니다.

오류 시 작업은 실패 상태로 종료되며 요청 URL, API 키, 원본 오류 응답은 출력하지 않습니다.

## 사용한 공식 액션과 문서

- [actions/checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)
- [actions/setup-python v7.1.0](https://github.com/actions/setup-python/releases/tag/v7.1.0)
- [GitHub 예약·수동 실행](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)

공식 최신 안정 릴리스를 확인하고 위 버전으로 고정했습니다.
저장소 권한은 코드 읽기만 허용하며, API 키는 Python 실행 단계에만 전달합니다.
