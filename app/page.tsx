import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Vellum — 비즈니스의 다음 챕터",
  description: "계좌, 지출, 현금 흐름을 한곳에서. 더 멀리 보는 팀을 위한 새로운 금융 워크스페이스, Vellum.",
};

export default function Home() { return <Landing />; }
