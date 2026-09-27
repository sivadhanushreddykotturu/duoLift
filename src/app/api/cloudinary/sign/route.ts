import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export async function POST() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "duolift_progress";

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json(
        { error: "Cloudinary credentials not configured in environment" },
        { status: 500 }
      );
    }

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      apiSecret
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      apiKey,
      cloudName,
    });
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
}
