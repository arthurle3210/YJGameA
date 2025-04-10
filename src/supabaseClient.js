import { createClient } from '@supabase/supabase-js';

// 替換為您的Supabase URL和anon key
// 這些值可以在Supabase儀表板中的"設置" > "API"中找到
// 注意：在生產環境中，應該使用環境變量來存儲這些敏感信息
// 這些值可以在Supabase儀表板中的"設置" > "API"中找到
const supabaseUrl = 'https://fcytuyffvxqufhhixlfy.supabase.co'; // 例如: https://abcdefghijklm.supabase.co
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjeXR1eWZmdnhxdWZoaGl4bGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODg2MTUsImV4cCI6MjA1OTc2NDYxNX0.UMnj7i7aF7y3XvpgKHdM7y9Vx0tkw4PBiZokMZwmrQM'; // 以eyJ開頭的長字符串

export const supabase = createClient(supabaseUrl, supabaseKey);