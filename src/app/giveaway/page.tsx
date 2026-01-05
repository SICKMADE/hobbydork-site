"use client";

import * as React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { db } from "@/firebase/client-provider";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

const GIVEAWAY_ID = "current";

type GiveawayConfig = {
  title?: string;
  prize?: string;
  imageUrl?: string;
  isActive?: boolean;
  startAt?: { toDate: () => Date };
  endAt?: { toDate: () => Date };
};

type Platform = "x" | "facebook" | "instagram" | "tiktok";

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string; help: string }> = [
  { value: "x", label: "X (Twitter)", help: "Share a post on X and paste the post link." },
  { value: "facebook", label: "Facebook", help: "Share a public post and paste the post link." },
  { value: "instagram", label: "Instagram", help: "Share a post/reel and paste the link to it." },
  { value: "tiktok", label: "TikTok", help: "Share a TikTok and paste the link to it." },
];

function normalizeOrigin(raw: string) {
  return raw.replace(/\/+$/g, "");
}

function getShareTargetUrl() {
  if (typeof window === "undefined") return "";
  return normalizeOrigin(
    (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) as string,
  );
}

function buildShareText(targetUrl: string) {
  return `Check out AOPO: ${targetUrl}`;
}

function buildShareIntent(platform: Platform, targetUrl: string) {
  const text = buildShareText(targetUrl);
  const encodedUrl = encodeURIComponent(targetUrl);
  const encodedText = encodeURIComponent(text);

  switch (platform) {
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedText}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "instagram":
      // Instagram doesn't support a standard web share intent for posts.
      // We fall back to copy link instructions.
      return "";
    case "tiktok":
      // TikTok share intents are not reliably supported on web.
      // We fall back to copy link instructions.
      return "";
    default:
      return "";
  }
}

function isLikelyPostUrl(platform: Platform, url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    if (platform === "x") return host.endsWith("x.com") || host.endsWith("twitter.com");
    if (platform === "facebook") return host.endsWith("facebook.com") || host.endsWith("fb.com");
    if (platform === "instagram") return host.endsWith("instagram.com");
    if (platform === "tiktok") return host.endsWith("tiktok.com");

    return false;
  } catch {
    return false;
  }
}

export default function GiveawayPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [config, setConfig] = React.useState<GiveawayConfig | null>(null);
  const [platform, setPlatform] = React.useState<Platform>("x");
  const [postUrl, setPostUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const targetUrl = getShareTargetUrl();

  const platformMeta = PLATFORM_OPTIONS.find((p) => p.value === platform);

  const canReadFirestore =
    !loading &&
    !!user &&
    user.emailVerified;

  React.useEffect(() => {
    if (!canReadFirestore) return;
    if (!db) return;
    const unsub = onSnapshot(doc(db, "giveaways", GIVEAWAY_ID), (snap) => {
      if (!snap.exists()) {
        setConfig(null);
        return;
      }
      setConfig(snap.data() as GiveawayConfig);
    });
    return () => unsub();
  }, [canReadFirestore]);

  const now = Date.now();
  const startMs = config?.startAt?.toDate?.() ? config.startAt.toDate().getTime() : null;
  const endMs = config?.endAt?.toDate?.() ? config.endAt.toDate().getTime() : null;
  const isConfigured = Boolean(config && startMs && endMs);
  const isOpen = Boolean(
    config?.isActive &&
      typeof startMs === "number" &&
      typeof endMs === "number" &&
      now >= startMs &&
      now <= endMs,
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(targetUrl);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Could not copy link", description: "Please copy it manually." });
    }
  }

  function openShare() {
    const intent = buildShareIntent(platform, targetUrl);
    if (!intent) {
      toast({
        title: "Share manually",
        description: "This platform doesn't support web share links. Copy the link and post it from the app/site.",
      });
      return;
    }

    window.open(intent, "_blank", "noopener,noreferrer");
  }

  async function submitEntry() {
    if (loading) return;

    if (!isConfigured) {
      toast({
        title: "Giveaway not configured",
        description: "Please check back later.",
      });
      return;
    }

    if (!isOpen) {
      toast({
        title: "Giveaway not open",
        description: "Entries are not being accepted right now.",
      });
      return;
    }

    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to enter the giveaway." });
      return;
    }

    // userData removed; rely on user and loading only

    if (!postUrl.trim()) {
      toast({ title: "Missing link", description: "Paste the URL to your social post." });
      return;
    }

    if (!isLikelyPostUrl(platform, postUrl.trim())) {
      toast({
        title: "That link doesn't look right",
        description: "Please paste the URL to your post on the selected platform.",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Prevent duplicate entries per platform per giveaway per user.
      if (!db) return;
      const existingQ = query(
        collection(db, "giveawayEntries"),
        where("uid", "==", user.uid),
        where("giveawayId", "==", GIVEAWAY_ID),
        where("platform", "==", platform),
      );
      const existingSnap = canReadFirestore ? await getDocs(existingQ) : { empty: true };
      if (!existingSnap.empty) {
        toast({
          title: "Already submitted",
          description: "You already submitted an entry for this platform.",
        });
        return;
      }

      if (!db) return;
      await addDoc(collection(db, "giveawayEntries"), {
        uid: user.uid,
        giveawayId: GIVEAWAY_ID,
        platform,
        postUrl: postUrl.trim(),
        status: "PENDING",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Entry submitted",
        description: "Thanks! Your entry is pending review.",
      });
      setPostUrl("");
    } catch (e: unknown) {
      toast({
        title: "Could not submit entry",
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{config?.title || "AOPO Giveaway"}</h1>
          <p className="text-sm text-muted-foreground">
            Share AOPO on social media to earn entries.
          </p>
        </div>

        {config?.imageUrl && (
          <Card className="overflow-hidden">
            <div className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.imageUrl}
                alt={config?.title || "Giveaway"}
                className="w-full max-h-[360px] object-contain bg-muted"
              />
            </div>
          </Card>
        )}

        <Card className="border border-red-500/40 bg-muted/40">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {config?.prize && (
              <div className="rounded-md border p-3 bg-background/50">
                <div className="font-semibold">Prize</div>
                <div className="text-muted-foreground">{config.prize}</div>
              </div>
            )}

            {isConfigured && (
              <div className="rounded-md border p-3 bg-background/50">
                <div className="font-semibold">Entry window</div>
                <div className="text-muted-foreground">
                  {config?.startAt?.toDate?.()
                    ? config.startAt.toDate().toLocaleString()
                    : ""}
                  {" "}→{" "}
                  {config?.endAt?.toDate?.() ? config.endAt.toDate().toLocaleString() : ""}
                </div>
                <div className="text-muted-foreground">
                  Status: {isOpen ? "OPEN" : "CLOSED"}
                </div>
              </div>
            )}

            {!isConfigured && (
              <div className="rounded-md border p-3 bg-background/50">
                <div className="font-semibold">Coming soon</div>
                <div className="text-muted-foreground">
                  The giveaway isn’t configured yet.
                </div>
              </div>
            )}

            <ol className="list-decimal pl-5 space-y-2">
              <li>Select a platform and share the AOPO link.</li>
              <li>Paste the URL to your post below.</li>
              <li>Submit to create your entry (staff may review).</li>
            </ol>
            <div className="rounded-md border p-3 bg-background/50">
              <div className="font-semibold">Important</div>
              <div className="text-muted-foreground">
                Make sure your post is public so it can be verified. This promotion is not
                sponsored, endorsed, or administered by any social platform.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit an entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{platformMeta?.help}</p>
            </div>

            <div className="space-y-2">
              <Label>AOPO link to share</Label>
              <div className="flex gap-2">
                <Input readOnly value={targetUrl} />
                <Button type="button" variant="outline" onClick={copyLink}>
                  Copy
                </Button>
                <Button type="button" onClick={openShare}>
                  Share
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: include a quick note about why you like the app.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Link to your post</Label>
              <Input
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                One entry per platform for this giveaway.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={submitEntry} disabled={submitting || !isOpen}>
                {submitting ? "Submitting…" : "Submit Entry"}
              </Button>
            </div>

            {!isOpen && (
              <div className="text-sm text-muted-foreground">
                Entries are currently closed.
              </div>
            )}

            {!user && (
              <div className="text-sm text-muted-foreground">
                You’ll need to sign in to submit.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
