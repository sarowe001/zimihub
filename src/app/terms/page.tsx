import StaticPage from "@/components/StaticPage";

export default function TermsPage() {
  return (
    <StaticPage title="শর্তাবলী">
      <p>
        জিমিহাব ব্যবহার করার মাধ্যমে আপনি নিচের শর্তাবলীতে সম্মত হচ্ছেন:
      </p>
      <ul className="list-inside list-disc space-y-2">
        <li>প্রতিটি API রিকোয়েস্টের খরচ আপনার ব্যালেন্স থেকে কেটে নেওয়া হয়।</li>
        <li>ব্যালেন্স টপ-আপ সাধারণত ফেরতযোগ্য নয়, তবে ব্যবহার না হওয়া অংশ সহায়তা টিমের মাধ্যমে অনুরোধ করা যেতে পারে।</li>
        <li>API key ব্যক্তিগত এবং গোপনীয় — অপব্যবহার হলে অ্যাকাউন্ট স্থগিত করা হতে পারে।</li>
        <li>বেআইনি বা ক্ষতিকর কনটেন্ট তৈরির জন্য এই সেবা ব্যবহার করা নিষিদ্ধ।</li>
      </ul>
    </StaticPage>
  );
}
