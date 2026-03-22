import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <div className="font-sans antialiased bg-slate-100 min-h-screen selection:bg-indigo-100 selection:text-indigo-900 sm:flex sm:flex-col sm:justify-center overflow-hidden">
      <RouterProvider router={router} />
    </div>
  );
}
