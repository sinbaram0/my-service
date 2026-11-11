"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import styles from "./todos.module.css";

type Todo = { id: number; title: string; is_done: boolean; created_at: string };

export default function TodosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === "INITIAL_SESSION") return;
      revision++;
      setUser(session?.user ?? null);
      if (!session) router.replace("/login");
    });
    const initialRevision = revision;
    void supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!active || revision !== initialRevision) return;
      if (error && error.status !== 401 && error.status !== 403 && error.name !== "AuthSessionMissingError") {
        setAuthError("로그인 상태를 확인하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요."); return;
      }
      if (user) { setAuthError(""); setUser(user); }
      else router.replace("/login");
    }).catch(() => { if (active) setAuthError("로그인 상태를 확인하지 못했어요. 다시 시도해 주세요."); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, attempt]);

  if (!user) return <main lang="ko" className={styles.page}><div className={styles.container}>
    {authError ? <div role="alert" className={styles.error}>{authError}<button type="button" onClick={() => { setAuthError(""); setAttempt((value) => value + 1); }}>다시 확인하기</button></div>
      : <p className={styles.empty} role="status">로그인 상태를 확인하고 있어요…</p>}
  </div></main>;
  return <TodoList key={user.id} user={user} />;
}

function todoMessage(error: unknown, fallback: string) {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (code === "42703" || code === "PGRST204") return "사용자 번호를 저장할 테이블 설정이 준비되지 않았어요. Supabase 테이블 설정을 확인해 주세요.";
  if (code === "PGRST116") return "계정에 연결된 사용자 번호 또는 할 일을 찾지 못했어요. 로그인 상태와 테이블 설정을 확인해 주세요.";
  if (code === "42501") return "할 일에 접근할 권한이 없어요. Supabase의 사용자별 권한 정책을 확인해 주세요.";
  return fallback;
}

async function getUserNumber(authUserId: string): Promise<number> {
  const { data, error } = await supabase.from("app_users").select("user_id")
    .eq("auth_user_id", authUserId).single();
  if (error) throw error;
  if (!Number.isInteger(data.user_id) || data.user_id < 1000001 || data.user_id > 9999999) {
    throw new Error("사용자 번호가 올바르지 않아요.");
  }
  return data.user_id;
}

function TodoList({ user }: { user: User }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const mounted = useRef(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const locks = useRef(new Set<number>());
  const adding = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const ownerUserId = await getUserNumber(user.id);
      if (!mounted.current) return;
      setUserNumber(ownerUserId);
      // Fetch in batches so lists over the Data API's default row limit also load.
      const all: Todo[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("todos").select("id,title,is_done,created_at")
          .eq("user_id", ownerUserId)
          .order("created_at", { ascending: false }).order("id", { ascending: false }).range(from, from + 999);
        if (error) throw error;
        all.push(...data);
        if (data.length < 1000) break;
      }
      if (mounted.current) setTodos(all);
    } catch (error) {
      if (mounted.current) setError(todoMessage(error, "할 일을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요."));
    } finally { if (mounted.current) setLoading(false); }
  }, [user.id]);

  useEffect(() => {
    mounted.current = true;
    // Start after mount; a cancelled effect must not start a new request.
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void load(); });
    return () => { cancelled = true; mounted.current = false; };
  }, [load]);

  async function currentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user || data.user.id !== user.id) {
      router.replace("/login"); throw new Error("로그인 상태가 변경되었어요.");
    }
    return getUserNumber(data.user.id);
  }

  async function logout() {
    if (signingOut) return;
    setSigningOut(true); setError("");
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      setTodos([]); setTitle(""); router.replace("/login");
    } catch { setError("로그아웃하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요."); }
    finally { setSigningOut(false); }
  }

  async function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = title.trim();
    if (!value || adding.current || signingOut) return;
    adding.current = true;
    setSaving(true); setError(""); setNotice("");
    try {
      const ownerUserId = await currentUser();
      const { data, error } = await supabase.from("todos").insert({ title: value, user_id: ownerUserId })
        .select("id,title,is_done,created_at").single();
      if (error) throw error;
      if (!mounted.current) return;
      setTodos((items) => [data, ...items]);
      setTitle(""); setNotice("새 할 일을 저장했어요.");
    } catch (error) { setError(todoMessage(error, "저장하지 못했어요. 입력한 내용을 확인하고 다시 시도해 주세요.")); }
    finally { adding.current = false; setSaving(false); input.current?.focus(); }
  }

  async function changeTodo(todo: Todo, action: "toggle" | "delete") {
    if (locks.current.has(todo.id) || signingOut) return;
    locks.current.add(todo.id);
    setPending((ids) => [...ids, todo.id]); setError(""); setNotice("");
    try {
      const ownerUserId = await currentUser();
      const query = action === "delete"
        ? supabase.from("todos").delete().eq("id", todo.id).eq("user_id", ownerUserId)
        : supabase.from("todos").update({ is_done: !todo.is_done }).eq("id", todo.id).eq("user_id", ownerUserId);
      const { data, error } = await query.select("id,title,is_done,created_at").single();
      if (error) throw error;
      if (!mounted.current) return;
      setTodos((items) => action === "delete" ? items.filter((item) => item.id !== todo.id)
        : items.map((item) => item.id === todo.id ? data : item));
      setNotice(action === "delete" ? "할 일을 삭제했어요." : todo.is_done ? "미완료로 바꿨어요." : "완료했어요. 잘하셨어요!");
    } catch (error) { setError(todoMessage(error, action === "delete" ? "삭제하지 못했어요. 다시 시도해 주세요." : "완료 상태를 바꾸지 못했어요. 다시 시도해 주세요.")); }
    finally { locks.current.delete(todo.id); setPending((ids) => ids.filter((id) => id !== todo.id)); }
  }

  const done = todos.filter((todo) => todo.is_done).length;

  return (
    <main lang="ko" className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.nav}><Link href="/">내 서비스<span>.</span></Link><span>하나씩, 차근차근</span></nav>
        <div className={styles.account}><span>{user.email}{userNumber !== null && <> · 사용자 {userNumber}</>}</span><button type="button" disabled={signingOut || saving || pending.length > 0} onClick={() => void logout()}>{signingOut ? "로그아웃 중…" : "로그아웃"}</button></div>
        <header className={styles.header}>
          <div className={styles.accent} />
          <p className={styles.eyebrow}>MY TO-DO LIST</p>
          <h1>오늘의 할 일<span>.</span></h1>
          <p className={styles.description}>작은 시작이 쌓여, 오늘을 바꿔요.</p>
        </header>
        <section className={styles.panel} aria-label="할 일 관리">
          <form onSubmit={addTodo} className={styles.form}>
            <label htmlFor="todo-title">새로운 할 일</label>
            <div className={styles.inputRow}>
              <input ref={input} id="todo-title" value={title} onChange={(event) => setTitle(event.target.value)}
                placeholder="어떤 일을 해볼까요?" required disabled={saving || signingOut} autoComplete="off" />
              <button className={styles.add} disabled={saving || loading || signingOut || !title.trim()} type="submit">{saving ? "저장 중…" : "+ 추가"}</button>
            </div>
          </form>
          <div className={styles.listHeader}><h2>나의 할 일</h2><span>{loading ? "불러오는 중" : `${todos.length}개 중 ${done}개 완료`}</span></div>
          {error && <div className={styles.error} role="alert">{error}<button type="button" disabled={loading || saving || signingOut || pending.length > 0} onClick={() => { setLoading(true); setError(""); void load(); }}>목록 다시 불러오기</button></div>}
          <p className={styles.srOnly} role="status">{notice}</p>
          {loading ? <p className={styles.empty} role="status">할 일을 불러오고 있어요…</p> : todos.length === 0 ? (
            <div className={styles.empty}><span aria-hidden="true">✓</span><p>{error ? "목록을 불러온 뒤 다시 확인해 주세요." : "아직 등록된 할 일이 없어요."}</p><small>위 입력칸에서 첫 번째 할 일을 적어보세요.</small></div>
          ) : <ul className={styles.list}>{todos.map((todo) => (
            <li key={todo.id} className={`${styles.item} ${todo.is_done ? styles.done : ""}`}>
              <button type="button" className={styles.toggle} aria-pressed={todo.is_done}
                aria-label={`${todo.title}: ${todo.is_done ? "미완료로 바꾸기" : "완료로 바꾸기"}`}
                disabled={signingOut || pending.includes(todo.id)} onClick={() => void changeTodo(todo, "toggle")}>
                <span className={styles.check} aria-hidden="true">{todo.is_done ? "✓" : ""}</span><span className={styles.title}>{todo.title}</span>
              </button>
              <button type="button" className={styles.delete} aria-label={`${todo.title} 삭제`} disabled={signingOut || pending.includes(todo.id)} onClick={() => void changeTodo(todo, "delete")}>삭제</button>
            </li>
          ))}</ul>}
          <p className={styles.hint}>할 일을 누르면 완료 상태가 바뀝니다.</p>
        </section>
        <footer className={styles.footer}>한 가지씩 끝내는 기분 좋은 하루.</footer>
      </div>
    </main>
  );
}
