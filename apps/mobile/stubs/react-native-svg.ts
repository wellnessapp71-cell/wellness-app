import type React from "react";

export type NumberProp = number | string;

export interface SvgProps {
  width?: NumberProp;
  height?: NumberProp;
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: NumberProp;
  color?: string;
  opacity?: NumberProp;
  children?: React.ReactNode;
  [key: string]: any;
}

type SvgCompatComponent = React.FC<SvgProps>;

const Svg: SvgCompatComponent = (() => null) as any;

export default Svg;

export const SvgUri: SvgCompatComponent = (() => null) as any;
export const SvgXml: SvgCompatComponent = (() => null) as any;
export const Circle: SvgCompatComponent = (() => null) as any;
export const Path: SvgCompatComponent = (() => null) as any;
export const Rect: SvgCompatComponent = (() => null) as any;
export const Line: SvgCompatComponent = (() => null) as any;
export const Polyline: SvgCompatComponent = (() => null) as any;
export const Ellipse: SvgCompatComponent = (() => null) as any;
export const Polygon: SvgCompatComponent = (() => null) as any;
export const Defs: SvgCompatComponent = (() => null) as any;
export const LinearGradient: SvgCompatComponent = (() => null) as any;
export const RadialGradient: SvgCompatComponent = (() => null) as any;
export const Stop: SvgCompatComponent = (() => null) as any;
export const Mask: SvgCompatComponent = (() => null) as any;
export const G: SvgCompatComponent = (() => null) as any;
export const Text: SvgCompatComponent = (() => null) as any;
export const TSpan: SvgCompatComponent = (() => null) as any;
export const ForeignObject: SvgCompatComponent = (() => null) as any;
export const ClipPath: SvgCompatComponent = (() => null) as any;
export const Symbol: SvgCompatComponent = (() => null) as any;
export const Use: SvgCompatComponent = (() => null) as any;
