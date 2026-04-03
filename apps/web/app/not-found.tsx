export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2F2F7] p-6">
      <div className="w-full max-w-md rounded-[32px] border border-black/[0.05] bg-white p-8 text-center shadow-sm">
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#8A8A8E]">
          404
        </p>
        <h1 className="mt-3 text-[28px] font-bold tracking-tight text-black">
          Page not found
        </h1>
        <p className="mt-2 text-[15px] font-medium leading-6 text-[#8A8A8E]">
          The page you&apos;re looking for isn&apos;t available in this preview.
        </p>
      </div>
    </main>
  );
}
