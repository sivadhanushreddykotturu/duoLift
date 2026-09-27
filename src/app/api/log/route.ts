import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// POST /api/log — mark today as done
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const today = todayKey();

  await User.findOneAndUpdate(
    { clerkId: userId },
    { $addToSet: { logs: today } } // addToSet prevents duplicates
  );

  return NextResponse.json({ ok: true, date: today });
}
