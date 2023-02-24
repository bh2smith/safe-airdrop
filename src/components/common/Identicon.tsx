import Skeleton from "@mui/material/Skeleton";
import makeBlockie from "ethereum-blockies-base64";
import type { ReactElement, CSSProperties } from "react";
import { useMemo } from "react";

export interface IdenticonProps {
  address: string;
  size?: number;
}

const Identicon = ({ address, size = 40 }: IdenticonProps): ReactElement => {
  const style = useMemo<CSSProperties | null>(() => {
    try {
      const blockie = makeBlockie(address);
      return {
        backgroundImage: `url(${blockie})`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundSize: "cover",
      };
    } catch (e) {
      return null;
    }
  }, [address, size]);

  return !style ? <Skeleton variant="circular" width={size} height={size} /> : <div style={style} />;
};

export default Identicon;
