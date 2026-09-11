import StaticPage from "@/components/StaticPage";

export default function ContactPage() {
  return (
    <StaticPage title="যোগাযোগ">
      <p>যেকোনো প্রশ্ন বা সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন:</p>
      <ul className="list-inside list-disc space-y-2">
        <li>ইমেইল: support@zimihub.com</li>
        <li>ফেসবুক: facebook.com/zimihub</li>
      </ul>
    </StaticPage>
  );
}
