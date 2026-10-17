import type { Metadata } from "next";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminRepository } from "@/lib/data";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Profile" };

/** The session check and data reads happen inside Suspense, so the admin shell renders immediately. */
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" aria-busy="true" />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  await requireAdmin();
  const profile = await (await getAdminRepository()).getProfile();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-4xl font-semibold">Astrologer profile</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
