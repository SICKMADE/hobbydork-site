"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import FollowButton from "@/components/FollowButton";
import { doc, getDoc, getFirestore } from "firebase/firestore";
// Import the default export from client-init (the Firebase app instance)
import { getFirebase } from "@/firebase/client-init";
import { getDefaultAvatarUrl } from "@/lib/default-avatar";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const { firestore } = getFirebase();
    getDoc(doc(firestore, "users", userId)).then((snap) => {
      setProfile(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <AppLayout><div className="p-8 text-center">Loading...</div></AppLayout>;
  }
  if (!profile) {
    return <AppLayout><div className="p-8 text-center">User not found.</div></AppLayout>;
  }

  const avatar = profile.avatar || getDefaultAvatarUrl(userId);
  const displayName = profile.displayName || "User";
  const email = profile.email || null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-2 xs:px-4 py-4">
        <Card>
          <CardHeader className="text-center p-4 xs:p-6">
            <Avatar className="mx-auto mb-4 h-20 w-20 xs:h-24 xs:w-24">
              <AvatarImage src={avatar} alt={displayName} />
              <AvatarFallback />
            </Avatar>
            <CardTitle className="text-xl xs:text-2xl md:text-3xl flex items-center justify-center gap-2">
              {displayName}
              <FollowButton targetUid={userId} />
            </CardTitle>
            {email && <CardDescription>{email}</CardDescription>}
          </CardHeader>
          <CardContent className="p-4 xs:p-6">
            <div className="text-sm xs:text-base whitespace-pre-line">
              {profile.about || "No bio provided."}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
