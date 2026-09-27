import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

// POST /api/photo  body: { url, caption? }
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, caption } = await req.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  await connectToDatabase();

  const today = new Date().toISOString().slice(0, 10);

  await User.findOneAndUpdate(
    { clerkId: userId },
    { $push: { photos: { url, caption: caption ?? "", date: today } } }
  );

  return NextResponse.json({ ok: true });
}
