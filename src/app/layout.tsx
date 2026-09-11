import type { Metadata } from "next";
import { Noto_Sans_Bengali, Geist_Mono } from "next/font/google";
import "./globals.css";

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "জিমিহাব — এক API-তে সব AI মডেল, সাশ্রয়ী দামে",
  description:
    "OpenAI, Anthropic, DeepSeek, Gemini সহ শতাধিক AI মডেল এক API key দিয়ে ব্যবহার করুন। bKash ও Nagad দিয়ে সরাসরি টাকা দিয়ে পেমেন্ট করুন।",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bn"
      className={`${notoBengali.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
