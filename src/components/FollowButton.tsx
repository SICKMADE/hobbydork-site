"use client";
import { useEffect, useState } from "react";
import { isFollowing, followUser, unfollowUser } from "@/lib/follow";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function FollowButton({ targetUid, className = "" }: { targetUid: string; className?: string }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user || user.uid === targetUid) return;
    let mounted = true;
    isFollowing(targetUid).then((f) => {
      if (mounted) setFollowing(f);
    });
    return () => {
      mounted = false;
    };
  }, [user, targetUid]);

  if (!user || user.uid === targetUid) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(targetUid);
        setFollowing(false);
      } else {
        await followUser(targetUid);
        setFollowing(true);
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      className={className}
      disabled={loading}
      onClick={handleClick}
    >
      {following ? "Unfollow" : "Follow"}
    </Button>
  );
}
