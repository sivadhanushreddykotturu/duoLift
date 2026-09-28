import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// POST /api/log — mark today as done and/or log routine exercises
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const today = todayKey();

  let exercises: { name: string; sets?: string | number; reps?: string | number }[] | undefined;
  try {
    const body = await req.json();
    if (Array.isArray(body?.exercises)) {
      exercises = body.exercises;
    }
  } catch {
    // Body is optional (e.g. quick 1-tap check-in)
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.logs.includes(today)) {
    user.logs.push(today);
  }

  if (exercises !== undefined) {
    if (!user.workoutLogs) user.workoutLogs = [];
    const existingIndex = user.workoutLogs.findIndex((w) => w.date === today);
    if (existingIndex >= 0) {
      user.workoutLogs[existingIndex].exercises = exercises;
      user.workoutLogs[existingIndex].updatedAt = new Date();
    } else {
      user.workoutLogs.push({
        date: today,
        exercises,
        updatedAt: new Date(),
      });
    }
    user.markModified("workoutLogs");
  }

  user.markModified("logs");
  await user.save();

  return NextResponse.json({ 
    ok: true, 
    date: today, 
    workoutLogs: user.workoutLogs 
  });
}
