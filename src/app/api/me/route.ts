import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// GET /api/me  — returns current user + partner data
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  let user = await User.findOne({ clerkId: userId });

  if (!user) {
    // Create on first login
    const clerkUser = await currentUser();
    let code = makeCode();
    // Ensure uniqueness
    while (await User.exists({ code })) code = makeCode();

    user = await User.create({
      clerkId: userId,
      name: clerkUser?.firstName ?? clerkUser?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "User",
      email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? "",
      code,
      logs: [],
      photos: [],
    });
  }

  let partner = null;
  if (user.partnerId) {
    const p = await User.findOne({ clerkId: user.partnerId });
    if (p) {
      partner = {
        name: p.name,
        code: p.code,
        logs: p.logs,
        photos: p.photos,
      };
    }
  }

  return NextResponse.json({
    name: user.name,
    code: user.code,
    logs: user.logs,
    photos: user.photos,
    hasPartner: !!user.partnerId,
    partner,
  });
}
