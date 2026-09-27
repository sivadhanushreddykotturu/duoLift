import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 220,
          background: "linear-gradient(135deg, #0A0E13 0%, #161F2B 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "110px",
          border: "16px solid #CCFF00",
        }}
      >
        <span style={{ transform: "scale(1.2)" }}>⚡</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
