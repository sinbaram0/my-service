export function authMessage(code?: string) {
  switch (code) {
    case "invalid_credentials": return "이메일 또는 비밀번호를 확인해 주세요.";
    case "email_not_confirmed": return "받은 메일에서 이메일 인증을 완료한 뒤 로그인해 주세요.";
    case "user_already_exists": return "이미 가입된 이메일이에요. 로그인해 주세요.";
    case "weak_password": return "더 안전한 비밀번호를 사용해 주세요. 최소 6자 이상 입력해 주세요.";
    case "same_password": return "기존 비밀번호와 다른 새 비밀번호를 입력해 주세요.";
    case "over_email_send_rate_limit": return "인증 메일 발송 한도에 도달했어요. 잠시 후 다시 시도해 주세요.";
    case "over_request_rate_limit": return "인증 요청이 많아요. 잠시 후 다시 시도해 주세요.";
    case "otp_expired":
    case "flow_state_expired":
    case "session_not_found":
    case "reauthentication_needed": return "인증이 만료되었어요. 비밀번호 재설정 메일을 다시 요청해 주세요.";
    case "signup_disabled": return "현재 회원가입이 중지되어 있어요. 관리자에게 문의해 주세요.";
    default: return "인증을 완료하지 못했어요. 입력 내용과 인터넷 연결을 확인하고 다시 시도해 주세요.";
  }
}
