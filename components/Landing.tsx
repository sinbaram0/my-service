"use client";

import { useRef, useState } from "react";

export default function Landing() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [sent, setSent] = useState(false); const [error, setError] = useState(false);
  const [menu, setMenu] = useState(false);
  const [period, setPeriod] = useState("월간");
  const open = () => { setSent(false); setError(false); dialog.current?.showModal(); };
  return (
    <main className="vellum" lang="ko">
      <header className="masthead">
        <a href="#" className="wordmark" aria-label="Vellum 홈"><span className="brand-icon">v</span>vellum<span className="brand-dot">®</span></a>
        <nav aria-label="메인 메뉴" className={menu ? "navigation expanded" : "navigation"}>
          <a href="#platform" onClick={() => setMenu(false)}>플랫폼</a><a href="#philosophy" onClick={() => setMenu(false)}>우리의 관점</a><a href="#questions" onClick={() => setMenu(false)}>자주 묻는 질문</a>
        </nav>
        <button className="header-cta" onClick={open}>얼리 액세스 신청 <span aria-hidden="true">↗</span></button>
        <button className="menu-toggle" aria-label="메뉴" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? "닫기" : "메뉴"}</button>
      </header>

      <section className="hero">
        <div className="hero-intro"><span className="live-dot" />더 멀리 보는 팀을 위한 금융</div>
        <h1>Make room<br />for what’s next.</h1>
        <div className="hero-bottom"><p>숫자를 관리하는 시간을 줄이고,<br />가능성을 만드는 시간을 늘리세요.<br /><span>비즈니스 금융의 새로운 챕터, Vellum.</span></p><button className="primary-button" onClick={open}>다음 챕터 시작하기 <span aria-hidden="true">↗</span></button></div>
        <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="orbit orbit-four" /><div className="art-core" /><span className="art-caption">A new perspective on capital.</span></div>
        <div className="hero-foot"><span>Clarity for your capital.</span><a href="#platform">아래에서 만나보세요 <span aria-hidden="true">↓</span></a><span>Seoul, built for everywhere.</span></div>
      </section>

      <section id="platform" className="platform section-wrap">
        <div className="section-heading"><p className="section-kicker">당신의 비즈니스, 한눈에</p><h2>복잡한 금융에서<br />명료한 다음 수로.</h2><p className="section-description">흩어진 계좌와 지출을 하나의 흐름으로 연결합니다.<br />지금의 자금 상황을 이해하고, 다음 결정을 준비하세요.</p></div>
        <div className="workspace">
          <aside className="workspace-side"><span className="mini-brand">vellum</span><span className="company-name">Studio Ordinary <span>⌄</span></span><span className="side-active">◉ &nbsp; 오버뷰</span><span>▤ &nbsp; 연결 계좌</span><span>↗ &nbsp; 지출 관리</span><span>◷ &nbsp; 현금 흐름</span><span className="side-bottom">◈ &nbsp; 워크스페이스 설정</span></aside>
          <div className="workspace-main"><div className="dashboard-top"><span>좋은 흐름을 만들고 있어요.</span><span className="demo-label">제품 미리보기 · 예시 데이터</span></div><div className="balance-row"><div><p>총 보유 자금</p><strong>₩284,560,000</strong><small>연결된 3개 계좌 기준</small></div><div className="period-control" aria-label="차트 기간">{["월간", "분기"].map(p => <button aria-pressed={period === p} className={period === p ? "selected" : ""} onClick={() => setPeriod(p)} key={p}>{p}</button>)}</div></div>
          <div className="chart" role="img" aria-label={`${period} 자금 흐름 예시 차트`}><div className="chart-grid"><span>3억</span><span>2억</span><span>1억</span></div><svg viewBox="0 0 700 180" preserveAspectRatio="none"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e94560" stopOpacity=".25"/><stop offset="1" stopColor="#e94560" stopOpacity="0"/></linearGradient></defs><path d={period === "월간" ? "M0 150 C45 150 45 122 90 125 S145 145 180 100 S240 115 280 85 S340 100 380 65 S450 90 490 48 S550 66 590 30 S650 42 700 12 L700 180 L0 180Z" : "M0 160 C80 160 80 130 150 138 S240 75 310 100 S420 40 480 65 S600 20 700 8 L700 180 L0 180Z"} fill="url(#chartFill)" stroke="#e94560" strokeWidth="2"/></svg></div><div className="chart-labels">{(period === "월간" ? ["11.01", "11.07", "11.14", "11.21", "11.30"] : ["9월", "10월", "11월"]).map(p => <span key={p}>{p}</span>)}</div><div className="dashboard-stats"><div><span>이번 달 유입</span><strong>₩68,400,000 <i>↗</i></strong></div><div><span>이번 달 지출</span><strong>₩32,180,000</strong></div><div><span>예상 런웨이</span><strong>18.4 <em>개월</em></strong></div></div></div>
        </div>
        <div className="feature-row"><article><span className="feature-symbol">⊞</span><h3>모든 계좌, 하나의 시야</h3><p>계좌마다 로그인할 필요 없이.<br />전체 자금의 움직임을 한곳에서 확인하세요.</p></article><article><span className="feature-symbol">↗</span><h3>지출에도, 분명한 맥락</h3><p>어디에 얼마나 쓰는지 파악하고,<br />팀의 지출을 더 명확하게 관리하세요.</p></article><article><span className="feature-symbol">◷</span><h3>오늘을 넘어, 다음까지</h3><p>현금 흐름과 런웨이를 함께 살펴보세요.<br />자금 계획에 필요한 관점을 제공합니다.</p></article></div>
      </section>

      <section id="philosophy" className="manifesto section-wrap"><div className="manifesto-note"><span className="tiny-star">✳</span><p>우리가 금융을<br />다시 생각하는 이유.</p></div><div><h2>좋은 금융은<br />가능성을 좁히지 않는다.<br /><span>더 넓게 열어준다.</span></h2><p>비즈니스를 만든다는 건 아직 없는 미래를 믿는 일.<br />우리는 그 믿음이 복잡한 금융 앞에서 멈추지 않도록,<br />당신의 다음 선택을 위한 명료함을 만듭니다.</p><span className="manifesto-sign">The Vellum perspective</span></div></section>

      <section id="questions" className="faq section-wrap"><h2>궁금한 점이 있나요?</h2><div>{[{q:"Vellum은 어떤 팀을 위한 서비스인가요?", a:"여러 계좌와 팀 지출을 관리하는 스타트업과 소규모 비즈니스를 위해 준비하고 있습니다. 자금 현황을 한곳에서 확인하고 싶은 팀이라면 얼리 액세스를 신청해 주세요."},{q:"지금 바로 사용할 수 있나요?",a:"현재는 출시 준비 단계입니다. 얼리 액세스를 신청하면 출시 소식과 참여 방법을 안내받을 수 있습니다. 이 페이지의 대시보드는 예시 데이터로 구성된 제품 미리보기입니다."},{q:"계좌 연결이나 실제 송금도 가능한가요?",a:"현재 미리보기에서는 실제 계좌 연결, 송금, 결제가 이루어지지 않습니다. 출시 시 지원 기능과 보안 정책, 이용 조건을 별도로 안내할 예정입니다."}].map(item => <details key={item.q}><summary>{item.q}<span aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></section>

      <section className="closing section-wrap"><p>당신의 다음 챕터를 기다립니다.</p><h2>Less friction.<br />More possibility.</h2><button className="primary-button" onClick={open}>얼리 액세스 신청 <span aria-hidden="true">↗</span></button><span className="closing-note">출시 소식을 가장 먼저 받아보세요.</span></section>
      <footer className="footer section-wrap"><a href="#" className="wordmark">vellum®</a><p>금융에 명료함을. 비즈니스에 가능성을.</p><span>© 2026 Vellum. Concept experience.</span></footer>
      <dialog ref={dialog} className="access-dialog" onClick={e => { if(e.target === e.currentTarget) dialog.current?.close(); }}><button className="dialog-close" aria-label="닫기" onClick={() => dialog.current?.close()}>×</button>{sent ? <div role="status"><span className="success-mark">✓</span><h2>다음 챕터를 준비했어요.</h2><p>이 기기에 신청 정보가 저장되었습니다.<br />현재는 데모로, 이메일 발송이나 서버 접수는 이루어지지 않습니다.</p><button className="primary-button" onClick={() => dialog.current?.close()}>확인</button></div> : <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); try { localStorage.setItem("vellum-early-access", JSON.stringify({ email: data.get("email"), company: data.get("company") })); setSent(true); } catch { setError(true); } }}><span className="mini-brand">vellum</span><h2>다음 챕터를<br />함께 시작해요.</h2><p>출시를 기다리는 팀을 위한 얼리 액세스 데모입니다.</p><label htmlFor="company">회사명</label><input id="company" name="company" autoComplete="organization" placeholder="회사 또는 팀 이름" required /><label htmlFor="email">업무용 이메일</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required /><p className="form-note">입력한 정보는 이 브라우저에만 저장됩니다. 실제 출시 알림 신청으로 전송되지 않습니다.</p>{error && <p role="alert">브라우저 저장 공간에 접근할 수 없습니다. 저장 허용 설정을 확인한 뒤 다시 시도해 주세요.</p>}<button className="primary-button" type="submit">데모 신청 완료하기 <span aria-hidden="true">↗</span></button></form>}</dialog>
    </main>
  );
}
