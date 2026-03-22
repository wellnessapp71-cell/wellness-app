import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { WheelScreen } from "./screens/WheelScreen";
import { DiscoverScreen } from "./screens/DiscoverScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AdminScreen } from "./screens/AdminScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginScreen,
  },
  {
    path: "/admin",
    Component: AdminScreen,
  },
  {
    path: "/app",
    Component: Layout,
    children: [
      { index: true, Component: DashboardScreen },
      { path: "wheel", Component: WheelScreen },
      { path: "discover", Component: DiscoverScreen },
      { path: "profile", Component: ProfileScreen },
    ],
  },
]);
