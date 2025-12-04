import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ISO24 } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ImageIcon } from "lucide-react";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import type { User } from "@/lib/types";
import { doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Image from "next/image";

interface ISO24CardProps {
  post: ISO24;
  onMessageSeller?: (uid: string) => void;
}

export default function ISO24Card({ post, onMessageSeller }: ISO24CardProps) {
  const firestore = useFirestore();

  // Support multiple possible field names: creatorUid, userUid, ownerUid
  const creatorUid =
    (post as any).creatorUid ||
    (post as any).userUid ||
    (post as any).ownerUid ||
    "";

  const userRef = useMemoFirebase(() => {
    if (!firestore || !creatorUid) return null;
    return doc(firestore, "users", creatorUid);
  }, [firestore, creatorUid]);

  const { data: user } = useDoc<User>(userRef);

  const expiresAt =
    (post as any).expiresAt && (post as any).expiresAt.toDate
      ? (post as any).expiresAt.toDate()
      : null;
  const expiresIn = expiresAt
    ? formatDistanceToNow(expiresAt, { addSuffix: true })
    : "soon";

  const handleMessageClick = () => {
    if (!creatorUid || !onMessageSeller) return;
    onMessageSeller(creatorUid);
  };

  return (
    <Card className="flex flex-col md:flex-row">
      {post.imageUrl ? (
        <div className="relative md:w-1/3 aspect-video md:aspect-square">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
          />
        </div>
      ) : (
        <div className="md:w-1/3 aspect-video md:aspect-square bg-muted flex items-center justify-center rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col flex-1">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          {user && (
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={user.avatar} alt={user.displayName || ""} />
              <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1">
            <CardTitle>{post.title}</CardTitle>
            <CardDescription>
              Posted by {user?.displayName || "..."}
              {expiresAt && <> &bull; Expires {expiresIn}</>}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {post.description}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
            {post.category}
          </div>
          <Button variant="outline" onClick={handleMessageClick} disabled={!onMessageSeller}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Seller
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
