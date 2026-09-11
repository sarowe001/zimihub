# জিমিহাব (ZimiHub)

xKiro-এর ধাঁচে বাংলায় বানানো একটি পূর্ণাঙ্গ **AI Gateway** — এক API key দিয়ে
OpenAI, Anthropic, DeepSeek, Google-এর মডেল ব্যবহার করা যায়, ব্যালেন্স
**bKash ও Nagad** দিয়ে টাকায় টপ-আপ করা যায়, এবং প্রতিটি রিকোয়েস্টের
টোকেন/খরচ ড্যাশবোর্ডে দেখা যায়।

## টেক স্ট্যাক

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- **Prisma 6** + SQLite (ডেভ) — প্রোডাকশনে সহজেই Postgres-এ বদলানো যায়
- **NextAuth v5** (Credentials — ইমেইল/পাসওয়ার্ড)
- **Recharts** (ব্যবহারের চার্ট)

## দ্রুত শুরু (ডেভেলপমেন্ট)

```bash
npm install
cp .env.example .env      # ইতিমধ্যে করা থাকলে বাদ দিন
npx prisma db push        # SQLite ডাটাবেস তৈরি করবে
npm run db:seed           # ডেমো মডেল ও দাম সিড করবে
npm run dev
```

`http://localhost:3000` খুলুন। সাইনআপ করলেই ২৫ টাকা ফ্রি ব্যালেন্স পাবেন।

## প্রজেক্ট গঠন

```
prisma/schema.prisma        ডাটাবেস স্কিমা (User, ApiKey, Provider, Model, UsageLog, Transaction)
prisma/seed.ts              ডেমো provider/model/দাম সিড স্ক্রিপ্ট
src/app/                    ল্যান্ডিং, লগইন/সাইনআপ, ড্যাশবোর্ড, ডকুমেন্টেশন
src/app/api/v1/              AI Gateway পাবলিক এন্ডপয়েন্ট (OpenAI + Anthropic compatible)
src/app/api/billing/         bKash/Nagad create + callback রুট
src/lib/gateway/             Gateway-এর মূল লজিক (auth, provider routing, ফরম্যাট রূপান্তর, বিলিং)
src/lib/payments/            bKash ও Nagad পেমেন্ট ইন্টিগ্রেশন
```

## AI Gateway কীভাবে কাজ করে

পাবলিক এন্ডপয়েন্ট:

- `POST /api/v1/chat/completions` — OpenAI Chat Completions ফরম্যাট
- `POST /api/v1/messages` — Anthropic Messages ফরম্যাট
- `GET /api/v1/models` — মডেলের তালিকা ও টাকায় দাম

**যেকোনো মডেল যেকোনো এন্ডপয়েন্ট দিয়ে কল করা যায়** — ভেতরে একটি "unified"
রিকোয়েস্ট ফরম্যাটে রূপান্তর করে তারপর upstream provider-এর নিজস্ব
ফরম্যাটে (OpenAI-style বা Anthropic Messages) পাঠানো হয় (`src/lib/gateway/translate.ts`)।

প্রতিটি রিকোয়েস্টে:

1. `Authorization: Bearer zh_live_...` হেডার দিয়ে API key যাচাই (হ্যাশ মিলিয়ে, `src/lib/gateway/auth.ts`)
2. ব্যালেন্স ও ওই key-এর মাসিক খরচের সীমা চেক
3. মডেল রিজলভ + `fallbackModelId` অনুযায়ী ফলব্যাক চেইন (`src/lib/gateway/handler.ts`)
4. উত্তর পেলে টোকেন গুনে খরচ হিসাব (`src/lib/gateway/pricing.ts`) করে ব্যালেন্স থেকে কেটে নেওয়া
5. `UsageLog`-এ সব কিছু লগ হয় (SUCCESS/FALLBACK/ERROR)

### স্ট্রিমিং

`stream: true` দিলে SSE আকারে টোকেন-বাই-টোকেন উত্তর যায়। upstream-এর ইভেন্ট
unified delta-তে রূপান্তর করে ক্লায়েন্ট যে ফরম্যাট চেয়েছে সেই SSE-তে লেখা হয়
(`src/lib/gateway/stream.ts`) — অর্থাৎ Anthropic মডেলও OpenAI-স্টাইল স্ট্রিম
দিতে পারে, এবং উল্টোটাও। স্ট্রিম শেষ হলে (ক্লায়েন্ট মাঝপথে কেটে দিলেও) টোকেন
হিসাব করে বিল করা হয়।

### খরচ নিয়ন্ত্রণ

- ব্যালেন্সের চেয়ে বেশি খরচ ঠেকাতে আউটপুট টোকেনের সীমা স্বয়ংক্রিয়ভাবে কমিয়ে আনা হয়
- প্রতিটি API key-তে মাসিক খরচের সীমা (৳) দেওয়া যায় — ছাড়ালে HTTP 429
- প্রতি রিকোয়েস্টে সর্বনিম্ন ১ পয়সা ধরা হয় (খুব ছোট রিকোয়েস্ট যেন ফ্রি না হয়ে যায়)

## এডমিন প্যানেল (মডেল ও দাম বদলানো)

নিজের অ্যাকাউন্টকে এডমিন বানান:

```bash
npm run make:admin -- you@example.com
```

এরপর ড্যাশবোর্ডে **এডমিন** মেনু আসবে (`/dashboard/admin`), যেখান থেকে করা যায়:

- প্রতিটি মডেলের ইনপুট/আউটপুট দাম বদলানো
- মডেল চালু/বন্ধ, ফ্রি/পেইড করা
- প্রোভাইডার চালু/বন্ধ করা
- ইউজারের ব্যালেন্সে ম্যানুয়ালি টাকা যোগ করা (গেটওয়ে কলব্যাক ব্যর্থ হলে)
- মোট আয় ও রিকোয়েস্ট সংখ্যা দেখা

নতুন provider/model যোগ করতে `prisma/seed.ts`-এ এন্ট্রি দিন (provider-এর
`kind` দিয়ে ঠিক হয় সেটা OpenAI না Anthropic ঘরানার API) এবং `.env`-এ সেই
provider-এর আসল API key বসান।

## bKash ও Nagad লাইভ করতে যা লাগবে

### bKash

1. https://merchant.bkash.com (বা আপনার bKash রিলেশনশিপ ম্যানেজারের মাধ্যমে) থেকে **Merchant Tokenized Checkout** সুবিধা চালু করুন।
2. sandbox টেস্ট করতে https://developer.bka.sh/ থেকে sandbox app key/secret নিন।
3. `.env`-এ বসান:
   ```
   BKASH_BASE_URL=...          # লাইভ হলে sandbox URL থেকে প্রোডাকশন URL-এ বদলান
   BKASH_APP_KEY=...
   BKASH_APP_SECRET=...
   BKASH_USERNAME=...
   BKASH_PASSWORD=...
   BKASH_CALLBACK_URL=https://yourdomain.com/api/billing/bkash/callback
   ```
4. কোড: `src/lib/payments/bkash.ts` (ইতিমধ্যে Tokenized Checkout API-এর জন্য প্রস্তুত)।

### Nagad

1. Nagad-এর সাথে **Merchant Payment Gateway (PGW)** চুক্তি করুন — তারা merchant ID, একটি RSA key-pair (আপনার প্রাইভেট কী) এবং তাদের পাবলিক কী দেবে।
2. `.env`-এ বসান:
   ```
   NAGAD_BASE_URL=...
   NAGAD_MERCHANT_ID=...
   NAGAD_MERCHANT_PRIVATE_KEY=...   # PEM, এক লাইনে \n দিয়ে অথবা base64 বডি
   NAGAD_PG_PUBLIC_KEY=...
   NAGAD_CALLBACK_URL=https://yourdomain.com/api/billing/nagad/callback
   ```
3. ⚠️ `src/lib/payments/nagad.ts` সাধারণভাবে প্রচলিত Nagad Checkout API ফ্লো
   (initialize → complete → verify, RSA sign/encrypt) অনুযায়ী লেখা হয়েছে।
   **লাইভ যাওয়ার আগে অবশ্যই** Nagad আপনাকে যে ইন্টিগ্রেশন ডকুমেন্ট দেবে
   তার সাথে endpoint URL ও পেলোডের ফিল্ড নাম মিলিয়ে নিন এবং sandbox-এ পুরো
   ফ্লো টেস্ট করুন (callback query param নাম, ভিন্ন হলে
   `src/app/api/billing/nagad/callback/route.ts`-এ বদলে দিন)।

## AI প্রোভাইডার কী

আসল মডেল কল করতে `.env`-এ বসান:

```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
DEEPSEEK_API_KEY=...
GOOGLE_API_KEY=...
```

কোনো একটা key না থাকলে সেই provider-এর মডেল কল করলে স্পষ্ট এরর মেসেজ
দেখাবে (ব্যালেন্স কাটবে না)।

## প্রোডাকশনে যেতে

- **ডাটাবেস:** `prisma/schema.prisma`-তে `provider = "postgresql"` করুন,
  `DATABASE_URL` বদলান, `npx prisma db push` চালান।
- **AUTH_SECRET:** `openssl rand -base64 32` দিয়ে নতুন সিক্রেট বানান।
- **NEXTAUTH_URL / APP_URL:** আপনার আসল ডোমেইন বসান।
- সব `BKASH_*` / `NAGAD_*` sandbox URL প্রোডাকশন URL-এ বদলান এবং লাইভ
  ক্রেডেনশিয়াল বসান।

## এখনো যা যোগ করা যেতে পারে

- ইমেইল ভেরিফিকেশন / পাসওয়ার্ড রিসেট
- প্রতি সেকেন্ডে রিকোয়েস্ট রেট লিমিট (এখন শুধু মাসিক খরচের সীমা আছে)
- টুল/ফাংশন কলিং ও ছবি (multimodal) পাস-থ্রু
- খরচের হিসাব পয়সার চেয়ে সূক্ষ্ম এককে (এখন সর্বনিম্ন ১ পয়সা)
