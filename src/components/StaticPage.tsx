import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function StaticPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold text-white">{title}</h1>
          <div className="space-y-4 text-slate-300">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
