import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <span
        style={{
          fontSize: 60,
          fontWeight: 700,
          color: "#a03e40",
          fontFamily: "serif",
          lineHeight: 1,
        }}
      >
        F
      </span>
    </div>,
    { ...size }
  );
}
