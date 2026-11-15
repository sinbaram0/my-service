# 코드 자동 검사

## 현재 실행 가능한 검사

이 프로젝트에는 `tests/password-reset.test.mjs`가 있으며 Node.js 기본 테스트 러너를 사용합니다.
새 테스트 도구를 설치하거나 `npm test` 명령을 가정하지 않습니다.

프로젝트 폴더에서 다음 명령을 실행합니다.

```sh
node --test tests/password-reset.test.mjs
npm run lint
```

두 명령은 로컬에서 실제로 실행하여 통과한 것을 확인했습니다. 테스트는 총 8개입니다.
의존성이 아직 설치되지 않은 환경에서는 먼저 `npm ci`를 실행합니다.

## 무엇을 확인하나요?

- 비밀번호 재설정 요청과 올바른 복귀 주소
- 세션 없음, 거절된 복구 요청, 만료된 링크에서 변경 폼을 숨기는지
- 다른 계정으로 세션이 바뀌면 비밀번호 변경을 차단하는지
- 비밀번호 확인 불일치를 차단하고, 변경 성공 후 로그아웃하는지
- 인증되지 않았거나 인증 서버 오류가 있을 때 비공개 할 일을 숨기는지
- ESLint로 프로젝트 전체의 코드 규칙 위반 확인

인증 응답은 테스트에서 흉내 내므로 실제 계정, 이메일 발송, API 키, 외부 네트워크는 필요 없습니다.
이 테스트는 실제 브라우저 조작, GPS 위치, 실시간 날씨 API, Python 날씨 자동화를 검사하지 않습니다.
프로덕션 빌드도 이번 CI 범위에는 포함하지 않습니다.

## GitHub Actions 작동 방식

`.github/workflows/ci.yml`이 다음 순서로 검사합니다.

1. 저장소 코드를 가져옵니다.
2. 로컬에서 검증한 버전과 같은 계열인 Node.js 26을 준비합니다.
3. `npm ci`로 `package-lock.json`에 기록된 의존성을 설치합니다.
4. `node --test tests/password-reset.test.mjs`로 기존 테스트 8개를 실행합니다.
5. `npm run lint`로 코드 규칙을 검사합니다.

GitHub에 코드를 푸시하거나 PR을 생성·업데이트하면 실행됩니다.
Actions 화면의 **Run workflow** 버튼으로도 실행할 수 있습니다.
이 파일이 GitHub에 올라간 뒤부터 작동하며, 로컬 파일만 생성한 상태에서는 자동 검사가 시작되지 않습니다.
새 GitHub Secret은 필요 없습니다. 기존 `.github/workflows/daily-weather.yml`은 별도로 유지됩니다.

## 검사 결과 확인

1. GitHub 저장소의 **Actions → CI**를 엽니다.
2. 확인하려는 커밋의 실행을 선택합니다.
3. **Tests and lint** 작업을 엽니다.
4. **Run existing tests** 또는 **Check code style**의 로그를 확인합니다.

초록색은 통과, 빨간색은 실패입니다. 실패한 검사를 로컬에서 같은 명령으로 실행해 수정한 뒤 다시 푸시하면 재검사합니다.
자동 검사는 실패를 알려 주지만 직접 푸시나 배포를 차단하는 설정은 아닙니다.
병합을 강제로 막으려면 GitHub의 브랜치 보호 규칙을 별도로 설정해야 합니다.

## 공식 액션

- [actions/checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)
- [actions/setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0)

공식 최신 안정 릴리스를 확인한 뒤 버전을 고정했습니다. 저장소 권한은 코드 읽기만 허용합니다.
