import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(".env.local에 Supabase 공개용 접속 정보를 설정해 주세요.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
