import * as React from "react";

declare module "expo-camera" {
  export const CameraView: React.FC<any>;
  export const CameraType: any;
  export function useCameraPermissions(): [
    { granted?: boolean } | null,
    () => Promise<any>,
  ];
}
