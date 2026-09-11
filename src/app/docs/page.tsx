import StaticPage from "@/components/StaticPage";

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-slate-900 p-4 font-mono text-sm text-emerald-300">
      {children}
    </pre>
  );
}

export default function DocsPage() {
  return (
    <StaticPage title="ডকুমেন্টেশন">
      <p>
        জিমিহাব দুটি এন্ডপয়েন্ট দেয় — একটি OpenAI-compatible, আরেকটি
        Anthropic-compatible। যেকোনো মডেল যেকোনো এন্ডপয়েন্ট দিয়ে কল করা
        যাবে — জিমিহাব ভেতরে ভেতরে ফরম্যাট রূপান্তর করে দেয়।
      </p>

      <h2 className="pt-4 text-xl font-semibold text-white">
        ১. API Key তৈরি করুন
      </h2>
      <p>
        সাইনআপ করে ড্যাশবোর্ড → API Key পেজ থেকে একটি key তৈরি করুন। key-টি
        <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">zh_live_</code>
        দিয়ে শুরু হবে এবং একবারই দেখানো হবে।
      </p>

      <h2 className="pt-4 text-xl font-semibold text-white">
        ২. OpenAI-compatible এন্ডপয়েন্ট
      </h2>
      <Code>{`curl https://zimihub.com/api/v1/chat/completions \\
  -H "Authorization: Bearer zh_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5-mini",
    "messages": [{ "role": "user", "content": "আসসালামু আলাইকুম!" }]
  }'`}</Code>

      <h2 className="pt-4 text-xl font-semibold text-white">
        ৩. Anthropic-compatible এন্ডপয়েন্ট
      </h2>
      <Code>{`curl https://zimihub.com/api/v1/messages \\
  -H "Authorization: Bearer zh_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-5",
    "max_tokens": 1024,
    "messages": [{ "role": "user", "content": "আসসালামু আলাইকুম!" }]
  }'`}</Code>

      <h2 className="pt-4 text-xl font-semibold text-white">৪. স্ট্রিমিং</h2>
      <p>
        <code className="rounded bg-white/10 px-1.5 py-0.5">stream: true</code>{" "}
        দিলে টোকেন আসার সাথে সাথেই SSE আকারে পাওয়া যাবে — দুই এন্ডপয়েন্টেই কাজ
        করে, এবং মডেল যে প্রোভাইডারেরই হোক, আপনি যে ফরম্যাটে চেয়েছেন সেই
        ফরম্যাটেই ইভেন্ট পাবেন।
      </p>
      <Code>{`curl https://zimihub.com/api/v1/chat/completions \\
  -H "Authorization: Bearer zh_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-5",
    "stream": true,
    "messages": [{ "role": "user", "content": "একটি কবিতা লিখুন" }]
  }'`}</Code>

      <h2 className="pt-4 text-xl font-semibold text-white">
        ৫. মডেলের তালিকা ও দাম
      </h2>
      <Code>{`curl https://zimihub.com/api/v1/models \\
  -H "Authorization: Bearer zh_live_xxxxxxxx"`}</Code>

      <h2 className="pt-4 text-xl font-semibold text-white">
        ৬. আপনার SDK-তে ব্যবহার করুন
      </h2>
      <p>
        যেকোনো OpenAI বা Anthropic SDK-তে শুধু base URL ও API key বদলে দিন —
        বাকি কোড অপরিবর্তিত থাকবে:
      </p>
      <Code>{`base_url = "https://zimihub.com/api/v1"
api_key  = "zh_live_xxxxxxxx"`}</Code>

      <h2 className="pt-4 text-xl font-semibold text-white">নোট</h2>
      <ul className="list-inside list-disc space-y-2">
        <li>প্রতিটি রিকোয়েস্টের খরচ সাথে সাথে ব্যালেন্স থেকে কেটে নেওয়া হয় (সর্বনিম্ন ১ পয়সা)।</li>
        <li>ব্যালেন্স শূন্য হয়ে গেলে রিকোয়েস্ট ব্যর্থ হবে — ড্যাশবোর্ড থেকে টাকা যোগ করুন।</li>
        <li>মডেল ব্যর্থ হলে স্বয়ংক্রিয়ভাবে বিকল্প মডেলে ফলব্যাক হতে পারে।</li>
        <li>প্রতিটি key-তে মাসিক খরচের সীমা দেওয়া যায় — সীমা শেষ হলে ওই key HTTP 429 পাবে।</li>
      </ul>
    </StaticPage>
  );
}
