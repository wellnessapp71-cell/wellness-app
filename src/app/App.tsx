import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <div className="font-sans antialiased bg-[#000000] sm:bg-[#E5E5EA] min-h-screen selection:bg-[#FF2D55]/20 selection:text-[#FF2D55] sm:flex sm:flex-col sm:justify-center overflow-hidden">
      <RouterProvider router={router} />
    </div>
  );
}
