import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ISO24 } from "@/lib/types";

import type { Iso24Post } from "@/lib/types";
type ISO24CardProps = {
  post: ISO24 | Iso24Post;
};
import { formatDistanceToNow } from "date-fns";
import { ImageIcon } from "lucide-react";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import type { User } from "@/lib/types";
import { doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { resolveAvatarUrl } from "@/lib/default-avatar";
import { labelIso24Category, normalizeIso24Category } from "@/lib/iso24";


import { useAuth } from "@/hooks/use-auth";


export function ISO24Card({ post }: ISO24CardProps) {
  const firestore = useFirestore();
  const { user: authUser, profile, loading: authLoading } = useAuth();
  const canReadFirestore =
    !authLoading &&
    !!authUser &&
    authUser.emailVerified &&
    profile?.status === "ACTIVE";

  // Support multiple possible field names: creatorUid, userUid, ownerUid
  const record = post as unknown as Record<string, unknown>;
  const creatorUid =
    (record.creatorUid as string) ||
    (record.userUid as string) ||
    (record.ownerUid as string) ||
    "";

  const userRef = useMemoFirebase(() => {
    if (!canReadFirestore || !firestore || !creatorUid) return null;
    return doc(firestore, "users", creatorUid);
  }, [canReadFirestore, firestore, creatorUid]);

  const { data: user } = useDoc<User>(canReadFirestore ? userRef : null);

  const expiresField = (record.expiresAt as unknown) ?? null;
  const expiresAt =
    expiresField && typeof (expiresField as { toDate?: unknown }).toDate === "function"
      ? (expiresField as { toDate: () => Date }).toDate()
      : null;
  const expiresIn = expiresAt
    ? formatDistanceToNow(expiresAt, { addSuffix: true })
    : "soon";

  const categoryValue = normalizeIso24Category((post as any)?.category);
  const categoryLabel = labelIso24Category(categoryValue);

  return (
    <Card className="flex flex-col md:flex-row overflow-hidden border-2 border-black bg-card/80 hover:bg-card transition-colors shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
      {post.imageUrl ? (
        <div className="relative md:w-1/3 aspect-video md:aspect-square bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="md:w-1/3 aspect-video md:aspect-square bg-muted flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col flex-1">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
          {user && (
            <Avatar className="h-11 w-11 border-2 border-black">
              <AvatarImage src={resolveAvatarUrl(user.avatar, user.uid)} alt={user.displayName || ""} />
              <AvatarFallback />
            </Avatar>
          )}
          <div className="flex-1">
            <CardTitle className="leading-snug">{post.title}</CardTitle>
            <CardDescription>
              Posted by {user?.displayName || "..."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow px-4 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {post.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 px-4 pb-4">
          <div className="text-xs font-extrabold tracking-tight border-2 border-black bg-muted/40 px-2 py-1 rounded-md">
            {categoryLabel}
          </div>
          {expiresAt ? (
            <div className="text-xs font-semibold border-2 border-black bg-muted/30 px-2 py-1 rounded-md text-muted-foreground">
              Expires {expiresIn}
            </div>
          ) : null}
        </CardFooter>
      </div>
    </Card>
  );
}
