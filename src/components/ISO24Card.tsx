import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ISO24 } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from "lucide-react";

interface ISO24CardProps {
    post: ISO24;
}

export default function ISO24Card({ post }: ISO24CardProps) {
    
    const expiresAt = post.expiresAt.toDate();
    const expiresIn = formatDistanceToNow(expiresAt, { addSuffix: true });

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                 <Avatar className="h-12 w-12 border">
                    <AvatarImage src={post.userAvatar} alt={post.userName} />
                    <AvatarFallback>{post.userName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>
                        Posted by {post.userName} &bull; Expires {expiresIn}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{post.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">{post.category}</div>
                <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message Seller
                </Button>
            </CardFooter>
        </Card>
    )
}
