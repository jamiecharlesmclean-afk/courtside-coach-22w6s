// The app imports each icon from its own file (keeps the web bundle small).
// Those per-file paths have no type declarations, so declare them as icon components.
declare module "lucide-react-native/dist/esm/icons/*.mjs" {
  import type { FC } from "react";
  import type { SvgProps } from "react-native-svg";
  const Icon: FC<SvgProps & { size?: number | string; color?: string; strokeWidth?: number; absoluteStrokeWidth?: boolean }>;
  export default Icon;
}
