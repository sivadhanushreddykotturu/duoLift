import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { name, image } = body;

    if (typeof name === "string" && name.trim().length > 0) {
      user.name = name.trim().slice(0, 50);
      user.markModified("name");
    }

    if (typeof image === "string") {
      user.image = image.trim();
      user.markModified("image");
    }

    await user.save();

    return NextResponse.json({
      ok: true,
      name: user.name,
      image: user.image ?? null,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
