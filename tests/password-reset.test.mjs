import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

// Isolated component harness: no browser session, email, network, or real credentials.
function mount(file, auth, href = "http://127.0.0.1:3000/reset-password") {
  const slots = [];
  const effects = [];
  const routes = [];
  let cursor = 0;
  let tree;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in slots)) { slots[index] = true; effects.push(effect); }
    },
  };
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "next/link": { default: "a" },
    "next/navigation": { useRouter: () => ({ replace: (path) => routes.push(path) }) },
    "@/lib/supabase": { supabase: { auth } },
    "@/lib/auth-message": { authMessage: () => "인증 오류" },
  };
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  runInNewContext(source, {
    exports, URL, URLSearchParams,
    window: { location: new URL(href) },
    require: (name) => {
      if (name.endsWith(".module.css")) return {};
      if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
      return modules[name];
    },
  });
  function render() { cursor = 0; tree = exports.default(); return tree; }
  function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap((child) => nodes(child));
    return [node, ...nodes(node.props?.children)];
  }
  render();
  effects.splice(0).forEach((effect) => effect());
  return {
    routes,
    async settle() { await new Promise((resolve) => setImmediate(resolve)); render(); },
    find(predicate) { return nodes(tree).find(predicate); },
    input(id, value) { this.find((node) => node.props?.id === id).props.onChange({ target: { value } }); render(); },
    async submit() { await this.find((node) => node.type === "form").props.onSubmit({ preventDefault() {} }); render(); },
    clickText(text) { this.find((node) => node.type === "button" && node.props.children === text).props.onClick(); render(); },
  };
}

function authStub() {
  const calls = { updates: 0, signouts: 0, recoveries: 0 };
  const auth = {
    initialize: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    getUser: async () => ({ data: { user: { id: "test-account", email: "user@example.test" } }, error: null }),
    updateUser: async () => { calls.updates++; return { error: null }; },
    signOut: async () => { calls.signouts++; return { error: null }; },
    resetPasswordForEmail: async (_email, options) => {
      calls.recoveries++;
      assert.equal(options.redirectTo, "http://127.0.0.1:3000/reset-password");
      assert.equal(Object.hasOwn(options, "password"), false);
      return { error: null };
    },
  };
  return { auth, calls };
}

test("forgot-password mode requests the correct callback without a password field", async () => {
  const { auth, calls } = authStub();
  auth.getUser = async () => ({ data: { user: null }, error: null });
  const page = mount("app/login/page.tsx", auth, "http://127.0.0.1:3000/login");
  await page.settle();
  page.clickText("비밀번호를 잊으셨나요?");
  assert.equal(page.find((node) => node.props?.type === "password"), undefined);
  page.input("email", "user@example.test");
  await page.submit();
  assert.equal(calls.recoveries, 1);
});

for (const scenario of ["missing session", "rejected recovery with an existing session", "expired link with an existing session"]) {
  test(`${scenario} never exposes the change form`, async () => {
    const { auth, calls } = authStub();
    if (scenario === "missing session") auth.getUser = async () => ({ data: { user: null }, error: null });
    if (scenario.startsWith("rejected")) auth.initialize = async () => ({ error: { code: "invalid_token" } });
    const page = mount("app/reset-password/page.tsx", auth,
      `http://127.0.0.1:3000/reset-password${scenario.startsWith("expired") ? "#error_code=otp_expired" : ""}`);
    await page.settle();
    assert.equal(page.find((node) => node.type === "form"), undefined);
    assert.ok(page.find((node) => node.props?.role === "alert"));
    assert.equal(calls.updates, 0);
  });
}

test("a changed session cannot update a different account", async () => {
  const { auth, calls } = authStub();
  const page = mount("app/reset-password/page.tsx", auth);
  await page.settle();
  const synthetic = randomBytes(16).toString("hex");
  page.input("new-password", synthetic);
  page.input("confirm-password", synthetic);
  auth.getUser = async () => ({ data: { user: { id: "different-account" } }, error: null });
  await page.submit();
  assert.equal(calls.updates, 0);
  assert.equal(page.find((node) => node.type === "form"), undefined);
});

test("confirmation mismatch prevents update; success clears inputs and signs out", async () => {
  const { auth, calls } = authStub();
  const page = mount("app/reset-password/page.tsx", auth);
  await page.settle();
  const synthetic = randomBytes(16).toString("hex");
  page.input("new-password", synthetic);
  page.input("confirm-password", randomBytes(16).toString("hex"));
  await page.submit();
  assert.equal(calls.updates, 0);
  page.input("confirm-password", synthetic);
  await page.submit();
  assert.equal(calls.updates, 1);
  assert.equal(calls.signouts, 1);
  assert.equal(page.find((node) => node.props?.type === "password"), undefined);
  assert.ok(page.find((node) => node.props?.href === "/login"));
});

test("unauthenticated todos redirects to login without loading private data", async () => {
  const { auth } = authStub();
  auth.getUser = async () => ({ data: { user: null }, error: { name: "AuthSessionMissingError" } });
  const page = mount("app/todos/page.tsx", auth);
  await page.settle();
  assert.deepEqual(page.routes, ["/login"]);
  assert.equal(page.find((node) => node.props?.user), undefined);
});

test("a failed auth-server request never displays the private todo component", async () => {
  const { auth } = authStub();
  auth.getUser = async () => ({ data: { user: null }, error: { name: "AuthRetryableFetchError", status: 503 } });
  const page = mount("app/todos/page.tsx", auth);
  await page.settle();
  assert.ok(page.find((node) => node.props?.role === "alert"));
  assert.equal(page.find((node) => node.props?.user), undefined);
  assert.deepEqual(page.routes, []);
});
