"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authMessage } from "@/lib/auth-message";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    let recovering = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && event === "PASSWORD_RECOVERY") {
        recovering = true;
        router.replace("/reset-password");
        return;
      }
      if (active && session && event !== "INITIAL_SESSION") router.replace("/todos");
    });
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || recovering) return;
      if (user) router.replace("/todos");
      else setChecking(false);
    }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError(""); setNotice("");
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("올바른 이메일 주소를 입력해 주세요."); return;
    }
    if (mode !== "reset" && password.length < 6) {
      setError("비밀번호는 6자 이상 입력해 주세요."); return;
    }
    submitting.current = true; setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(address, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) { setError(authMessage(error.code)); return; }
        setNotice("가입된 이메일이라면 재설정 링크가 전송됩니다. 받은 편지함과 스팸함을 확인해 주세요. 링크를 연 뒤 새 비밀번호를 설정할 수 있어요.");
        return;
      }
      const credentials = { email: address, password };
      const { data, error } = mode === "login"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: `${window.location.origin}/login` } });
      if (error) { setError(authMessage(error.code)); return; }
      setPassword("");
      if (data.session) router.replace("/todos");
      else {
        setMode("login");
        setNotice("가입 확인 메일을 확인해 주세요. 이메일 인증 후 이 화면에서 로그인해 주세요. 메일이 없다면 스팸함이나 기존 가입 여부를 확인해 주세요.");
      }
    } catch { setError("인증 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요."); }
    finally { submitting.current = false; setBusy(false); }
  }

  return (
    <main lang="ko" className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.nav}><Link href="/">내 서비스<span>.</span></Link><span>하나씩, 차근차근</span></nav>
        <header className={styles.header}>
          <div className={styles.accent} />
          <p className={styles.eyebrow}>MY TO-DO LIST</p>
          <h1>나만의 할 일<span>.</span></h1>
          <p className={styles.description}>로그인하고 오늘의 작은 시작을 기록해요.</p>
        </header>
        <section className={styles.panel} aria-label="로그인 및 회원가입">
          {checking ? <p className={styles.message} role="status">로그인 상태를 확인하고 있어요…</p> : <>
            <div className={styles.modes} aria-label="인증 방식">
              <button type="button" aria-pressed={mode === "login"} disabled={busy} onClick={() => { setMode("login"); setPassword(""); setError(""); setNotice(""); }}>로그인</button>
              <button type="button" aria-pressed={mode === "signup"} disabled={busy} onClick={() => { setMode("signup"); setPassword(""); setError(""); setNotice(""); }}>회원가입</button>
            </div>
            <form onSubmit={submit} noValidate className={styles.form}>
              <label htmlFor="email">이메일</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} />
              {mode !== "reset" && <><label htmlFor="password">비밀번호</label>
              <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required disabled={busy} aria-describedby="password-hint" />
              <p id="password-hint" className={styles.hint}>비밀번호는 6자 이상 입력해 주세요.</p></>}
              {mode === "reset" && <p className={styles.hint}>가입한 이메일로 비밀번호 재설정 링크를 보내드려요.</p>}
              {error && <p className={styles.error} role="alert">{error}</p>}
              {notice && <p className={styles.notice} role="status">{notice}</p>}
              <button className={styles.submit} type="submit" disabled={busy}>{busy ? "처리 중…" : mode === "reset" ? "재설정 메일 받기" : mode === "login" ? "로그인" : "회원가입"}</button>
            </form>
            {mode === "login" && <button className={styles.textButton} type="button" disabled={busy} onClick={() => { setMode("reset"); setPassword(""); setError(""); setNotice(""); }}>비밀번호를 잊으셨나요?</button>}
          </>}
        </section>
        <footer className={styles.footer}>한 가지씩 끝내는 기분 좋은 하루.</footer>
      </div>
    </main>
  );
}
