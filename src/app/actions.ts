"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { workoutSessions } from "@/db/schema";
import { getUser } from "@/lib/supabase/server";

export async function createSession() {
  const user = await getUser();
  if (!user) redirect("/login");

  const [session] = await db
    .insert(workoutSessions)
    .values({ userId: user.id })
    .returning({ id: workoutSessions.id });

  redirect(`/session/${session.id}`);
}
