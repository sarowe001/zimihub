import StaticPage from "@/components/StaticPage";

export default function AboutPage() {
  return (
    <StaticPage title="আমাদের সম্পর্কে">
      <p>
        জিমিহাব একটি AI Gateway — এক API key দিয়ে বিশ্বের সেরা AI মডেলগুলো
        (OpenAI, Anthropic, DeepSeek, Google) ব্যবহার করার সহজ উপায়। আমরা
        বাংলাদেশি ডেভেলপার ও উদ্যোক্তাদের জন্য বাংলায় এবং স্থানীয় পেমেন্ট
        মেথডে (bKash, Nagad) এই সুবিধা নিয়ে এসেছি।
      </p>
      <p>
        আলাদা আলাদা প্রোভাইডারের সাথে চুক্তি, আন্তর্জাতিক কার্ড, বা ডলার
        নিয়ে ঝামেলা না করে — এক জায়গা থেকেই সব মডেল অ্যাক্সেস করুন,
        সরাসরি টাকায় পেমেন্ট করুন।
      </p>
    </StaticPage>
  );
}
