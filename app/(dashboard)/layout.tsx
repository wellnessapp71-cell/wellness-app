import { TabBar } from "@/components/dashboard/tab-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#F2F2F7] overflow-hidden sm:rounded-[40px] sm:border-[10px] sm:border-[#1C1C1E] sm:h-[90vh] sm:mt-[5vh] shadow-2xl">
      <main className="flex-1 overflow-y-auto pb-28 scroll-smooth no-scrollbar">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
