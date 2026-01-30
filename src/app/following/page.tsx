"use client";
import { useEffect, useState } from "react";
import { getFollowing } from "@/lib/follow";
import { getUserProfiles } from "@/lib/userProfiles";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDefaultAvatarUrl } from "@/lib/default-avatar";

export default function FollowingListPage() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getFollowing(user.uid).then(async (uids) => {
      const sorted = uids.sort((a, b) => a.localeCompare(b));
      setFollowing(sorted);
      if (sorted.length > 0) {
        const profs = await getUserProfiles(sorted);
        setProfiles(profs);
      }
      setLoading(false);
    });
  }, [user]);

  if (!user) return <div className="p-8 text-center">Not signed in.</div>;
  if (loading) return <div className="p-8 text-center">Loading following...</div>;

  return (
    <div className="mx-auto max-w-xl px-2 xs:px-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Following</CardTitle>
        </CardHeader>
        <CardContent>
          {following.length === 0 ? (
            <div className="text-center text-muted-foreground">You are not following anyone yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {following.map((uid) => {
                const profile = profiles[uid] || {};
                const displayName = profile.displayName || uid;
                const avatar = profile.avatar || getDefaultAvatarUrl(uid);
                return (
                  <li key={uid} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-muted px-2 rounded" onClick={() => router.push(`/profile/${uid}`)}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatar} alt={displayName} />
                      <AvatarFallback />
                    </Avatar>
                    <span className="font-medium text-sm">{displayName}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
