'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useRouter } from "next/navigation";
import { MessageCircle, Store, User as UserIcon, Flag } from "lucide-react";
import { getAvatarUrl } from "./avatar-utils";
import { ReportUserDialog } from "@/components/moderation/ReportUserDialog";
import { useState } from "react";

export default function AvatarMenu({
  targetUid,
  targetProfile,
}: {
  targetUid: string;
  targetProfile: any;
}) {
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);

  const avatar = getAvatarUrl(targetProfile);
  const name = targetProfile?.displayName || "User";
  const storeId = targetProfile?.storeId || null;
  const isSeller = targetProfile?.isSeller === true;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full">
            <img
              src={avatar}
              alt={name}
              className="w-10 h-10 rounded-full border-2 border-black comic-avatar-shadow object-cover"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-48 border-2 border-black comic-panel">
          <div className="px-2 py-1 text-xs font-bold tracking-wide">
            {name}
          </div>

          <DropdownMenuSeparator />

          {/* View Profile */}
          <DropdownMenuItem
            className="text-xs cursor-pointer"
            onClick={() => router.push(`/profile/${targetUid}`)}
          >
            <UserIcon className="w-3 h-3 mr-2" />
            View Profile
          </DropdownMenuItem>

          {/* View Store */}
          {isSeller && storeId && (
            <DropdownMenuItem
              className="text-xs cursor-pointer"
              onClick={() => router.push(`/store/${storeId}`)}
            >
              <Store className="w-3 h-3 mr-2" />
              View Store
            </DropdownMenuItem>
          )}

          {/* Message User */}
          <DropdownMenuItem
            className="text-xs cursor-pointer"
            onClick={() => router.push(`/messages/new?recipientUid=${targetUid}`)}
          >
            <MessageCircle className="w-3 h-3 mr-2" />
            Message User
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Report */}
          <DropdownMenuItem
            className="text-xs text-red-500 cursor-pointer"
            onClick={() => setReportOpen(true)}
          >
            <Flag className="w-3 h-3 mr-2" />
            Report User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report dialog */}
      <ReportUserDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetUid={targetUid}
        targetDisplayName={name}
        context={{ source: "CHAT" }}
      />
    </>
  );
}
