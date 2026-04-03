"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F2F2F7]">
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-[32px] border border-black/[0.05] bg-white p-8 text-center shadow-sm">
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#FF3B30]">
              Build Guard
            </p>
            <h1 className="mt-3 text-[28px] font-bold tracking-tight text-black">
              Something went wrong
            </h1>
            <p className="mt-2 text-[15px] font-medium leading-6 text-[#8A8A8E]">
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 rounded-full bg-[#007AFF] px-5 py-3 text-[15px] font-semibold text-white"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
