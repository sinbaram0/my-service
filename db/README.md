# 사용자 연결 규칙

- `public.app_users.user_id`: 1000001~9999999의 정수. 자동 발급하며 재사용하지 않습니다. 동시 가입이나 실패한 트랜잭션 때문에 번호에 빈자리가 생길 수 있습니다.
- `public.app_users.auth_user_id`: Supabase `auth.users.id`와 연결하는 UUID. 로그인 연결에만 사용합니다.
- `public.todos.user_id`: `app_users.user_id`를 참조하는 정수. 기존 소유자 미지정 자료는 NULL로 보존하며 일반 사용자는 볼 수 없습니다.
- 신규 가입 시 비공개 트리거가 번호를 발급합니다. 클라이언트는 연결 정보를 직접 생성·수정·삭제할 수 없으며 자기 연결만 조회할 수 있습니다.

다른 사용자별 테이블도 `user_id integer references public.app_users(user_id)`로 연결합니다. 외래 키만으로 접근이 제한되지는 않습니다. RLS를 켜고 다음 소유자 조건을 SELECT/DELETE의 USING, INSERT의 WITH CHECK, UPDATE의 USING과 WITH CHECK에 모두 적용하세요.

```sql
user_id = (
  select user_id from public.app_users
  where auth_user_id = (select auth.uid())
)
```

정책은 `TO authenticated`로 제한하고 `user_id`에 인덱스를 추가합니다. 사용자가 전달한 숫자만 신뢰하지 않습니다. 사용자 번호만으로 이름이나 이메일을 알 수 있는 것은 아닙니다.

`changes/numeric-user-ids.sql`은 기존 UUID 소유자를 숫자로 변환하는 일회성 SQL입니다. Supabase 마이그레이션의 단일 트랜잭션으로 적용해야 합니다. 기존 내용 및 소유자 보존 검증에 실패하면 적용이 중단됩니다. 이 파일 자체는 원격 DB 적용 여부의 증거가 아닙니다.
