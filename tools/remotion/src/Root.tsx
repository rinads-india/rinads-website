import { Composition } from "remotion";
import { BusinessSimplifiedFilm } from "./BusinessSimplifiedFilm";

const common = { fps: 30, durationInFrames: 45 * 30 } as const;

export const RemotionRoot = () => (
  <>
    <Composition
      id="RINADSBusinessSimplifiedLandscape"
      component={BusinessSimplifiedFilm}
      {...common}
      width={1920}
      height={1080}
      defaultProps={{ vertical: false }}
    />
    <Composition
      id="RINADSBusinessSimplifiedVertical"
      component={BusinessSimplifiedFilm}
      {...common}
      width={1080}
      height={1920}
      defaultProps={{ vertical: true }}
    />
  </>
);
