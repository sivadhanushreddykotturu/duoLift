import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

// POST /api/pair  body: { code: string }
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  await connectToDatabase();

  const me = await User.findOne({ clerkId: userId });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (me.code === code.toUpperCase()) {
    return NextResponse.json({ error: "That's your own code!" }, { status: 400 });
  }

  const buddy = await User.findOne({ code: code.toUpperCase() });
  if (!buddy) return NextResponse.json({ error: "Code not found" }, { status: 404 });

  // Pair both ways
  await User.updateOne({ clerkId: userId }, { partnerId: buddy.clerkId });
  await User.updateOne({ clerkId: buddy.clerkId }, { partnerId: userId });

  return NextResponse.json({ ok: true, partnerName: buddy.name });
}

// DELETE /api/pair - unlinks the current user and their partner
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const me = await User.findOne({ clerkId: userId });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (me.partnerId) {
    const partnerClerkId = me.partnerId;
    // Unlink both users
    await User.updateOne({ clerkId: userId }, { $unset: { partnerId: "" } });
    await User.updateOne({ clerkId: partnerClerkId }, { $unset: { partnerId: "" } });
  }

  return NextResponse.json({ ok: true, message: "Partner removed successfully" });
}
