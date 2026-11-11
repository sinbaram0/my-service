"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { authMessage } from "@/lib/auth-message";
import styles from "../login/login.module.css";

export default function ResetPasswordPage() {
  const [checking, setChecking] = useState(true);
  const [account, setAccount] = useState<{ id: string; email?: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    let revision = 0;
    // A rejected recovery link must never fall back to a different existing account.
    const url = new URL(window.location.href);
    const fragment = new URLSearchParams(url.hash.slice(1));
    const invalidLink = ["error", "error_code", "error_description"].some(
      (name) => url.searchParams.has(name) || fragment.has(name),
    );
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!active || event !== "SIGNED_OUT") return;
      revision++;
      setAccount(null);
    });
    const initialRevision = revision;
    // Observe URL initialization errors too: getUser alone can return an older
    // signed-in account when the incoming recovery link was rejected by Auth.
    void supabase.auth.initialize().then(async ({ error: recoveryError }) => {
      if (invalidLink || recoveryError) {
        if (active) setError("재설정 링크가 없거나 만료되었어요. 로그인 화면에서 재설정 메일을 다시 요청해 주세요.");
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (!active || revision !== initialRevision) return;
      if (error || !data.user) {
        setError("재설정 링크가 없거나 만료되었어요. 로그인 화면에서 재설정 메일을 다시 요청해 주세요.");
      } else setAccount({ id: data.user.id, email: data.user.email });
    }).catch(() => {
      if (active) setError("인증 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 링크를 다시 열어 주세요.");
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function finishSignOut() {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      setError("비밀번호는 변경했지만 로그아웃을 완료하지 못했어요. 로그아웃을 다시 시도해 주세요.");
      return;
    }
    setError(""); setSignedOut(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !account || done) return;
    setError("");
    if (password.length < 6) { setError("새 비밀번호는 6자 이상 입력해 주세요."); return; }
    if (password !== confirmation) { setError("새 비밀번호와 확인 입력이 일치하지 않아요."); return; }
    submitting.current = true; setBusy(true);
    let updated = false;
    try {
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user || user.id !== account.id) {
        setPassword(""); setConfirmation(""); setAccount(null);
        setError("인증 상태가 변경되었어요. 재설정 메일의 링크를 다시 열어 주세요."); return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(authMessage(error.code)); return; }
      updated = true;
      setPassword(""); setConfirmation(""); setDone(true);
      await finishSignOut();
    } catch {
      setError(updated
        ? "비밀번호는 변경했지만 로그아웃을 완료하지 못했어요. 로그아웃을 다시 시도해 주세요."
        : "인증 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
    } finally { submitting.current = false; setBusy(false); }
  }

  async function retrySignOut() {
    if (submitting.current) return;
    submitting.current = true; setBusy(true);
    try { await finishSignOut(); }
    catch { setError("로그아웃하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요."); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <main lang="ko" className={styles.page}>
    <div className={styles.container}>
      <nav className={styles.nav}><Link href="/">내 서비스<span>.</span></Link><span>하나씩, 차근차근</span></nav>
      <header className={styles.header}>
        <div className={styles.accent} /><p className={styles.eyebrow}>MY TO-DO LIST</p>
        <h1>비밀번호 재설정<span>.</span></h1>
        <p className={styles.description}>새 비밀번호를 설정하고 다시 로그인해 주세요.</p>
      </header>
      <section className={styles.panel} aria-label="비밀번호 재설정">
        {checking ? <p className={styles.message} role="status">인증 링크를 확인하고 있어요…</p> : <>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {done ? <>
            <p className={styles.notice} role="status">비밀번호를 변경했어요.{signedOut && " 새 비밀번호로 로그인해 주세요."}</p>
            {!signedOut && <button className={styles.submit} type="button" disabled={busy} onClick={() => void retrySignOut()}>{busy ? "처리 중…" : "로그아웃 다시 시도"}</button>}
          </> : account ? <form onSubmit={submit} noValidate className={styles.form}>
            <p className={styles.hint}>{account.email} 계정의 비밀번호를 변경합니다.</p>
            <label htmlFor="new-password">새 비밀번호</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={6} required disabled={busy} value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="password-hint" />
            <label htmlFor="confirm-password">새 비밀번호 확인</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required disabled={busy} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            <p id="password-hint" className={styles.hint}>비밀번호는 6자 이상 입력해 주세요.</p>
            <button className={styles.submit} type="submit" disabled={busy}>{busy ? "변경 중…" : "비밀번호 변경"}</button>
          </form> : null}
          {(!done || signedOut) && <Link href="/login" className={styles.textButton}>로그인 화면으로</Link>}
        </>}
      </section>
    </div>
  </main>;
}
