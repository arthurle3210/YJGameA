import { createClient } from '@supabase/supabase-js';

// 替換為您的Supabase URL和anon key
// 這些值可以在Supabase儀表板中的"設置" > "API"中找到
// 注意：在生產環境中，應該使用環境變量來存儲這些敏感信息
// 這些值可以在Supabase儀表板中的"設置" > "API"中找到
const supabaseUrl = 'YOUR_SUPABASE_URL'; // 例如: https://abcdefghijklm.supabase.co
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // 以eyJ開頭的長字符串

export const supabase = createClient(supabaseUrl, supabaseKey);