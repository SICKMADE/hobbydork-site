
'use client';

import { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ListingCard from '@/components/ListingCard';
import GiveawayCard from '@/components/GiveawayCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, 
  ShieldCheck, 
  Heart, 
  Loader2, 
  Clock, 
  Ghost, 
  Medal, 
  Store, 
  Zap, 
  TrendingUp,
  Activity,
  Shield,
  Target,
  CircleDot,
  Anchor,
  CalendarX,
  Flag,
  ChevronRight,
  Gamepad2,
  Trophy,
  User,
  LayoutGrid,
  Settings,
  Circle,
  Terminal,
  Hammer,
  Copy,
  Truck,
  History,
  Link as LinkIcon,
  Radio,
  Crown
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn, getRandomAvatar, filterProfanity } from '@/lib/utils';
import type { Listing, Giveaway } from '@/lib/mock-data';
import { isListingExpired } from '@/lib/mock-data';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, setDoc, deleteDoc, getDoc, updateDoc, limit, query, where, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { TierBadge } from '@/components/TierBadge';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function SignRivets() {
  return (
    <>
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-inner border border-black/10 z-30" />
    </>
  );
}

export default function ShopPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(true);
  const [checkingFollow, setCheckingFollow] = useState(true);

  const storeRef = useMemoFirebase(() => db ? doc(db, 'storefronts', username) : null, [db, username]);
  const { data: storeData, isLoading: storeLoading } = useDoc(storeRef);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: currentUserProfile } = useDoc(profileRef);

  const sellerUsersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('username', '==', username.toLowerCase()), limit(1)) : null, [db, username]);
  const { data: sellerUsers } = useCollection(sellerUsersQuery);
  const sellerProfile = sellerUsers?.[0];

  const listingsQuery = useMemoFirebase(() => {
    if (!db || !sellerProfile?.uid) return null;
    return query(collection(db, 'listings'), where('listingSellerId', '==', sellerProfile.uid));
  }, [db, sellerProfile?.uid]);

  const giveawaysQuery = useMemoFirebase(() => {
    if (!db || !sellerProfile?.uid) return null;
    return query(collection(db, 'giveaways'), where('sellerId', '==', sellerProfile.uid));
  }, [db, sellerProfile?.uid]);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !sellerProfile?.uid) return null;
    return query(collection(db, 'reviews'), where('sellerId', '==', sellerProfile.uid), orderBy('timestamp', 'desc'));
  }, [db, sellerProfile?.uid]);

  const postsQuery = useMemoFirebase(() => db ? query(collection(db, 'storefronts', username, 'posts'), orderBy('timestamp', 'desc')) : null, [db, username]);

  const { data: listings } = useCollection<Listing>(listingsQuery as any);
  const { data: giveaways } = useCollection<Giveaway>(giveawaysQuery as any);
  const { data: reviews } = useCollection(reviewsQuery);
  const { data: posts } = useCollection(postsQuery);

  const [bannerSrc, setBannerSrc] = useState<string>('/hobbydork-banner-default.png');
  const [avatarSrc, setAvatarSrc] = useState<string>(() => getRandomAvatar(username));

  const visibleListings = listings?.filter(listing => {
    const isOwner = user?.uid === listing.listingSellerId;
    if (isOwner) return true;
    return listing.visibility === 'Visible';
  }) || [];

  const activeGiveaways = giveaways?.filter(g => g.status === 'Active') || [];

  useEffect(() => {
    if (!db || !user || !username) {
      setIsFollowLoading(false);
      setCheckingFollow(false);
      return;
    }
    const followId = `${user.uid}_${username}`;
    const followRef = doc(db, 'followers', followId);
    
    getDoc(followRef).then(snap => {
      setIsFollowing(snap.exists());
      setCheckingFollow(false);
      setIsFollowLoading(false);
    });
  }, [db, user, username]);

  useEffect(() => {
    if (storeData || sellerProfile) {
      setBannerSrc(storeData?.bannerUrl || '/hobbydork-banner-default.png');
      
      const ownerUid = storeData?.ownerUid || sellerProfile?.uid || username;
      const rawPhoto = storeData?.photoURL || storeData?.avatar || sellerProfile?.photoURL;
      
      const finalAvatar = (rawPhoto && (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:')))
        ? rawPhoto
        : getRandomAvatar(ownerUid);
        
      setAvatarSrc(finalAvatar);
    }
  }, [storeData, username, sellerProfile?.uid, sellerProfile?.photoURL]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Auth Required', description: 'Sign in to follow stores.' });
      return;
    }
    if (!db) return;

    const followId = `${user.uid}_${username}`;
    const followRef = doc(db, 'followers', followId);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        setIsFollowing(false);
        toast({ title: 'Unfollowed', description: `No longer following @${username}.` });
      } else {
        await setDoc(followRef, {
          userId: user.uid,
          storeId: username,
          timestamp: serverTimestamp()
        });
        setIsFollowing(true);
        toast({ title: 'Following!', description: `You'll now see updates from @${username}.` });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update follow status.' });
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !user || !db) return;

    if (!user.emailVerified || currentUserProfile?.status !== 'ACTIVE') {
      toast({ 
        variant: 'destructive', 
        title: 'Verification Required', 
        description: 'You must verify your email and have an active profile to post updates.' 
      });
      return;
    }

    setIsPosting(true);
    const sanitized = filterProfanity(newPostContent);
    const avatarUrl = currentUserProfile?.photoURL || getRandomAvatar(user.uid);

    const postData = {
      content: sanitized,
      authorId: user.uid,
      authorName: currentUserProfile?.username || user.displayName || username,
      authorAvatar: avatarUrl,
      timestamp: serverTimestamp(),
      likes: 0
    };

    try {
      await addDoc(collection(db, 'storefronts', username, 'posts'), postData);
      setNewPostContent('');
      toast({ title: 'Post Published!' });
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `storefronts/${username}/posts`,
        operation: 'create',
        requestResourceData: postData
      }));
    } finally {
      setIsPosting(false);
    }
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/storefronts/${username}`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL Copied", description: "Node address saved to clipboard." });
  };

  if (storeLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  if (!storeData) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><Ghost className="w-12 h-12 text-muted-foreground" /><h1 className="text-xl font-black uppercase">Store Not Found</h1><Button asChild variant="outline"><Link href="/">Back Home</Link></Button></div>;

  const isOwner = user?.uid === storeData.ownerUid;
  const appliedTheme = storeData?.theme || 'Default';
  const isComicBook = appliedTheme === 'Comic Book Theme';
  const isNeonSyndicate = appliedTheme === 'Neon Syndicate Theme';
  const isUrban = appliedTheme === 'Urban Theme';
  const is8BitTheme = appliedTheme === '8-BIT ARCADE THEME';
  const isGlitchProtocol = appliedTheme === 'Glitch Protocol Theme';
  const isVoidShard = appliedTheme === 'Void Shard Theme';
  const isHacked = appliedTheme === 'HACKED THEME';
  
  const activeListings = visibleListings?.filter((listing) => !isListingExpired(listing));

  // CSS Pattern Data
  const arcadeWindowsPattern = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='120' viewBox='0 0 80 120'%3E%3Crect width='80' height='120' fill='%230a0a1a'/%3E%3Crect x='10' y='10' width='25' height='40' fill='%231a1a3a'/%3E%3Crect x='45' y='10' width='25' height='40' fill='%231a1a3a'/%3E%3Crect x='10' y='65' width='25' height='40' fill='%231a1a3a'/%3E%3Crect x='45' y='65' width='25' height='40' fill='%231a1a3a'/%3E%3Crect x='12' y='12' width='4' height='4' fill='%232a2a5a'/%3E%3C/svg%3E";
  const arcadeLogoPattern = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='40' viewBox='0 0 240 40'%3E%3Ctext x='10' y='25' font-family='monospace' font-weight='900' font-size='12' fill='%23f00' opacity='0.2' letter-spacing='2'%3EHOBBYDORK%3C/text%3E%3C/svg%3E";

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-500 relative pb-32",
        isNeonSyndicate && "bg-zinc-950",
        isComicBook && "bg-background dark:bg-zinc-900 comic-dots",
        isUrban && "bg-[url('/wall.jpg')] bg-cover bg-fixed bg-center",
        is8BitTheme && "arcade-windows-bg-80",
        isVoidShard && "void-shard-bg",
        (isGlitchProtocol || isHacked) && "bg-zinc-900"
      )}
    >
      {is8BitTheme && (
        <>
           <div className="absolute top-0 left-0 right-0 h-48 bg-[#300] z-0 overflow-hidden border-b-4 border-black">
             <div className="absolute inset-0 opacity-100 pointer-events-none arcade-logo-bg" />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
           </div>
          <div className="fixed inset-0 pointer-events-none z-0 hardware-grid-overlay opacity-5" />
        </>
      )}
      
      {isGlitchProtocol && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden mix-blend-overlay opacity-30">
          <div className="w-full h-[2px] bg-red-600 shadow-[0_0_15px_red] animate-scanline absolute top-0" />
          <div className="w-full h-full animate-noise opacity-10" />
        </div>
      )}
      
      {(isVoidShard || isHacked) && <div className="fixed inset-0 pointer-events-none z-0 hardware-grid-overlay opacity-10" />}

      <Navbar />
      
      <div className={cn(
        "relative w-full h-48 md:h-96 overflow-hidden",
        isComicBook && "border-b-2 border-black", 
        isNeonSyndicate && "border-b border-cyan-500/20 bg-slate-900", 
        is8BitTheme && "border-b-4 border-black bg-zinc-950",
        isGlitchProtocol && "border-b-2 border-red-600 bg-zinc-950",
        isVoidShard && "border-b border-violet-500/20 bg-slate-900",
        isHacked && "border-b-2 border-[#00FF41] bg-slate-900",
        isUrban && "border-b-[10px] border-zinc-950 shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
      )}>
        <Image 
          src={bannerSrc} 
          alt="" 
          fill 
          className="object-cover" 
          priority 
          onError={() => setBannerSrc('/hobbydork-banner-default.png')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <section className={cn(
        "container mx-auto px-2 sm:px-4 max-w-6xl relative z-20 pb-4 sm:pb-6",
        "mt-0 md:-mt-24"
      )}>
        {storeData.vacationMode && (
          <div className="mb-4 animate-in slide-in-from-top duration-500">
            <Card className="bg-amber-500 text-zinc-900 border-none rounded-xl p-3 flex items-center justify-center gap-3 shadow-xl">
              <p className="font-black uppercase text-[9px] tracking-widest">Seller is currently away. New purchases are temporarily paused.</p>
            </Card>
          </div>
        )}

        <div className={cn(
          "p-4 md:p-8 transition-all relative", 
          isComicBook ? "bg-white dark:bg-zinc-900 border-[6px] border-black rounded-none shadow-[15px_15px_0px_#000] dark:shadow-[15px_15px_0px_#fff] text-black dark:text-white" : 
          isNeonSyndicate ? "bg-zinc-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-none text-white shadow-xl" : 
          isUrban ? "bg-white border-[4px] border-zinc-300 rounded-none text-black shadow-[0_30px_60px_rgba(0,0,0,0.4)]" : 
          is8BitTheme ? "bg-[#0a0a1a] border-4 border-black shadow-[10px_10px_0_0_#000] text-white rounded-none overflow-hidden" :
          isGlitchProtocol ? "bg-zinc-800/95 backdrop-blur-md border-2 border-red-600 rounded-none text-white shadow-[0_0_40px_rgba(220,38,38,0.2)] overflow-hidden" :
          isVoidShard ? "bg-zinc-900/80 border-2 border-violet-500/20 rounded-none text-white shadow-[0_0_40px_rgba(139,92,246,0.3)] backdrop-blur-3xl overflow-hidden" :
          isHacked ? "bg-black border-2 border-[#00FF41] rounded-none text-[#00FF41] font-mono overflow-hidden" :
          "bg-card border rounded-[1.5rem] overflow-hidden shadow-xl"
        )}>
            {isUrban && <SignRivets />}
            <div className="flex flex-col lg:flex-row gap-6 md:gap-10 items-center lg:items-start relative z-10 w-full">
               <div className={cn(
                 "w-24 h-24 md:w-40 md:h-40 rounded-xl md:rounded-[1.5rem] overflow-hidden border-2 border-white shadow-xl relative shrink-0 bg-zinc-100", 
                 isComicBook && "border-4 border-black rounded-none shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]", 
                 isUrban && "border-[6px] border-zinc-200 rounded-none",
                 is8BitTheme && "border-4 border-black shadow-[4px_4px_0_0_#000] rounded-none",
                 isGlitchProtocol && "border-2 border-red-600 rounded-none",
                 isHacked && "border-2 border-[#00FF41] rounded-none",
                 isNeonSyndicate && "border-2 border-cyan-400 shadow-[0_0_20px_cyan]",
                 isVoidShard && "border-2 border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.4)]"
               )}>
                  <Image 
                    src={avatarSrc} 
                    alt={username} 
                    fill 
                    className="object-cover" 
                    onError={() => setAvatarSrc(getRandomAvatar(storeData.ownerUid || username))}
                  />
                </div>
                
                <div className="flex-1 space-y-6 text-center lg:text-left w-full">
                  <div className="space-y-3">
                    <div className="flex flex-col items-center lg:items-start gap-2">
                      <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
                        <h1 className={cn(
                          "text-2xl sm:text-3xl md:text-5xl font-headline font-black uppercase tracking-tighter leading-none max-w-full overflow-hidden text-ellipsis whitespace-nowrap sm:whitespace-normal", 
                          isComicBook ? "text-black bg-yellow-400 border-[3px] border-black px-4 py-1 -rotate-1 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]" : 
                          isNeonSyndicate ? "text-white italic tracking-[0.1em] drop-shadow-[0_0_15px_rgba(34,211,238,1)]" : 
                          isUrban ? "text-black bg-zinc-100 border-2 border-zinc-200 px-6 py-2 shadow-inner" : 
                          is8BitTheme ? "text-[#ff2e88] italic text-4xl md:text-7xl drop-shadow-[4px_4px_0px_#000]" :
                          isGlitchProtocol ? "text-white italic tracking-tighter text-4xl animate-glitch-tactical animate-rgb-tactical" :
                          isVoidShard ? "text-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.8)] italic" :
                          isHacked ? "text-[#00FF41] font-mono text-4xl md:text-7xl" :
                          "text-primary"
                        )}>
                          {username}
                        </h1>
                        <ShieldCheck className={cn("w-6 h-6 md:w-10 md:h-10", is8BitTheme ? "text-cyan-400" : isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : isVoidShard ? "text-violet-500" : isUrban ? "text-black" : "text-primary")} />
                        {sellerProfile?.vaultUnlocked && (
                          <Badge className="bg-amber-500 text-zinc-950 border-none font-black uppercase text-[8px] tracking-widest gap-1 shadow-lg">
                            <Crown className="w-2.5 h-2.5" /> VAULT_LEGACY
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "font-bold text-sm md:text-lg uppercase tracking-[0.2em] italic max-w-full overflow-hidden text-ellipsis whitespace-nowrap sm:whitespace-normal", 
                        isHacked ? "text-[#00FF41]/60 font-mono" : 
                        isNeonSyndicate ? "text-cyan-400/60" :
                        isGlitchProtocol ? "text-red-600/60 font-mono" :
                        is8BitTheme ? "text-[#00f0ff] font-black" :
                        isVoidShard ? "text-violet-400/60" :
                        isUrban ? "text-zinc-500 font-black" :
                        "text-muted-foreground dark:text-white/60"
                      )}>
                        {storeData?.tagline || 'Verified Seller'}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-8 pt-2">
                      <div className="space-y-1">
                        <p className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-50", isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : is8BitTheme ? "text-[#ff2e88]" : isVoidShard ? "text-violet-500" : isUrban ? "text-zinc-500" : "text-muted-foreground")}>Health Status</p>
                        <TierBadge tier={sellerProfile?.sellerTier} />
                      </div>
                      <div className="space-y-1">
                        <p className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-50", isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : is8BitTheme ? "text-[#ff2e88]" : isVoidShard ? "text-violet-500" : isUrban ? "text-zinc-500" : "text-muted-foreground")}>Trades</p>
                        <div className="flex items-center gap-2">
                          <History className={cn("w-4 h-4", isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : is8BitTheme ? "text-[#00f0ff]" : isVoidShard ? "text-violet-400" : isUrban ? "text-black" : "text-accent")} />
                          <span className={cn("font-black text-sm md:text-lg", isHacked && "font-mono", isNeonSyndicate && "text-white", is8BitTheme && "text-white", isVoidShard && "text-white", isUrban && "text-black")}>{sellerProfile?.completedOrders || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-xl:max-w-none max-w-xl">
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-xl border-2 w-full overflow-hidden",
                      isHacked ? "bg-black border-[#00FF41]/20" : 
                      isNeonSyndicate ? "bg-zinc-950 border-cyan-500/20" :
                      isGlitchProtocol ? "bg-zinc-950 border-red-600/20" :
                      is8BitTheme ? "bg-black border-black shadow-[inner_2px_2px_0_0_#000] rounded-none" :
                      isVoidShard ? "bg-zinc-950 border-violet-500/20" :
                      isUrban ? "bg-zinc-50 border-zinc-200 rounded-none shadow-inner" :
                      "bg-muted/50 dark:bg-zinc-800 border-border dark:border-white/10"
                    )}>
                      <code className={cn(
                        "text-[9px] md:text-xs font-mono font-bold truncate flex-1",
                        isHacked ? "text-[#00FF41]" : 
                        isNeonSyndicate ? "text-cyan-400" :
                        isGlitchProtocol ? "text-red-600" :
                        is8BitTheme ? "text-yellow-400" :
                        "text-muted-foreground dark:text-white/60"
                      )}>
                        hobbydork.com/storefronts/{username}
                      </code>
                      <button title="Copy Link" onClick={handleCopyUrl} className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
                        is8BitTheme ? "text-yellow-400 hover:bg-yellow-400/10" : isUrban ? "text-black hover:bg-black/10" : "hover:bg-accent/10"
                      )}>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {!isOwner && (
                      <Button 
                        onClick={handleFollowToggle} 
                        disabled={isFollowLoading} 
                        className={cn(
                          "font-black px-10 h-12 uppercase tracking-[0.2em] transition-all active:scale-95 text-xs shrink-0 w-full sm:w-auto", 
                          isFollowing ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg" : 
                          is8BitTheme ? "bg-[#ff2e88] text-white border-none shadow-[4px_4px_0_0_#000] hover:translate-y-[-2px]" :
                          isHacked ? "bg-[#00FF41] text-black rounded-none font-mono" :
                          isGlitchProtocol ? "bg-red-600 text-white rounded-none italic shadow-[0_0_15px_red]" :
                          isNeonSyndicate ? "bg-cyan-400 text-black hover:bg-cyan-300 rounded-none italic" :
                          isComicBook ? "bg-yellow-400 text-black border-[3px] border-black rounded-none shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] hover:translate-y-[-2px]" :
                          isVoidShard ? "bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)] rounded-none italic" :
                          isUrban ? "bg-black text-white rounded-none border-none shadow-xl hover:translate-y-[-2px]" :
                          "bg-primary text-white rounded-lg shadow-lg"
                        )}
                      >
                        {isFollowing ? 'Following' : 'Follow Seller'}
                      </Button>
                    )}
                  </div>
                </div>
            </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl relative z-10">
        <Tabs defaultValue="listings" className="space-y-6 md:space-y-10">
          <TabsList className={cn(
            "p-1.5 h-12 md:h-16 border w-full sm:w-auto justify-start md:justify-center flex-nowrap overflow-x-auto scrollbar-hide rounded-xl md:rounded-2xl transition-all",
            is8BitTheme ? "bg-[#0a0a1a] border-black shadow-[6px_6px_0_0_#000] border-[3px] rounded-none backdrop-blur-md" :
            isHacked ? "bg-black border-[#00FF41] rounded-none h-16 font-mono" : 
            isGlitchProtocol ? "bg-zinc-900 border-2 border-red-600 rounded-none h-16" :
            isNeonSyndicate ? "bg-zinc-900 border-cyan-500/20 rounded-none h-16" :
            isComicBook ? "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none h-16 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]" :
            isUrban ? "bg-white border-[4px] border-zinc-200 rounded-none h-16 shadow-[10px_10px_0px_rgba(0,0,0,0.2)]" :
            "bg-muted dark:bg-zinc-800 shadow-inner"
          )}>
            {[
              { id: 'listings', label: 'Inventory', icon: LayoutGrid },
              { id: 'feed', label: 'Feed', icon: Activity },
              { id: 'about', label: 'About', icon: Shield },
              { id: 'reviews', label: 'Reviews', icon: Star },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className={cn(
                  "px-6 md:px-10 h-full font-black uppercase text-[9px] md:text-[11px] tracking-[0.2em] transition-all duration-300 gap-2 shrink-0",
                  is8BitTheme ? "rounded-none text-white/40 data-[state=active]:text-white data-[state=active]:bg-[#ff2e88] data-[state=active]:shadow-[2px_2px_0_0_#000]" :
                  isHacked ? "rounded-none text-[#00FF41]/40 data-[state=active]:text-black data-[state=active]:bg-[#00FF41]" : 
                  isGlitchProtocol ? "rounded-none text-red-600/40 data-[state=active]:text-white data-[state=active]:bg-red-600 data-[state=active]:animate-pulse" :
                  isNeonSyndicate ? "rounded-none text-cyan-400/40 data-[state=active]:text-white data-[state=active]:bg-cyan-400/10 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400" :
                  isComicBook ? "rounded-none text-black dark:text-white data-[state=active]:bg-yellow-400 data-[state=active]:text-black" :
                  isUrban ? "rounded-none text-zinc-500 data-[state=active]:text-black data-[state=active]:bg-zinc-100 data-[state=active]:border-zinc-300" :
                  "data-[state=active]:bg-background dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-md"
                )}
              >
                {tab.icon && <tab.icon className="w-3 h-3 md:w-4 md:h-4" />}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="listings" className="space-y-12 md:space-y-20">
            {activeGiveaways.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-2 relative",
                    isUrban ? "bg-white text-black px-6 py-2 border-2 border-zinc-200 shadow-xl" : ""
                  )}>
                    {isUrban && <SignRivets />}
                    <Zap className={cn("w-5 h-5", is8BitTheme ? "text-[#ff2e88]" : isHacked ? "text-[#00FF41]" : isGlitchProtocol ? "text-red-600" : isUrban ? "text-red-600" : "text-accent")} />
                    <h2 className={cn(
                      "text-xl md:text-3xl font-headline font-black uppercase italic tracking-tighter",
                      is8BitTheme ? "text-[#ff2e88]" : isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-white" : isUrban ? "text-black" : isGlitchProtocol ? "text-red-600" : "text-primary"
                    )}>Active Drops</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:gap-12">
                  {activeGiveaways.map((g) => <GiveawayCard key={g.id} giveaway={g} theme={appliedTheme} />)}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center gap-2 relative",
                  isUrban ? "bg-white text-black px-6 py-2 border-2 border-zinc-200 shadow-xl" : ""
                )}>
                  {isUrban && <SignRivets />}
                  <LayoutGrid className={cn("w-5 h-5", is8BitTheme ? "text-[#ff2e88]" : isHacked ? "text-[#00FF41]" : isGlitchProtocol ? "text-red-600" : isUrban ? "text-red-600" : "text-accent")} />
                  <h2 className={cn(
                    "text-xl md:text-3xl font-headline font-black uppercase italic tracking-tighter",
                    is8BitTheme ? "text-[#ff2e88]" : isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-white" : isUrban ? "text-black" : isGlitchProtocol ? "text-red-600" : "text-primary"
                  )}>Product Catalog</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-2 gap-y-6 md:gap-x-3 md:gap-y-12">
                {activeListings && activeListings.length > 0 ? (
                  activeListings.map((l) => <ListingCard key={l.id} listing={l} theme={appliedTheme} />)
                ) : (
                  <div className="col-span-full py-16 text-center border-2 border-solid rounded-[2rem] font-black uppercase text-[10px] tracking-widest text-zinc-400">NO_ITEMS_LOADED</div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feed">
            <div className="max-w-2xl mx-auto space-y-6">
              {isOwner && (
                <Card className={cn(
                  "p-4 md:p-6 rounded-[1.5rem] border-none shadow-xl relative",
                  is8BitTheme ? "bg-[#0a0a1a] border-none shadow-[10px_10px_0_0_#000] rounded-none" :
                  isHacked ? "bg-black border border-[#00FF41]/30 rounded-none" : 
                  isGlitchProtocol ? "bg-zinc-800 border border-red-600/30 rounded-none shadow-[0_0_30px_rgba(220,38,38,0.1)]" :
                  isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/20 rounded-none text-white" : 
                  isComicBook ? "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none shadow-[10px_10px_0px_#000] dark:shadow-[10px_10px_0px_#fff] text-black dark:text-white" : 
                  isUrban ? "bg-white border-[4px] border-zinc-200 rounded-none text-black shadow-2xl" : ""
                )}>
                  {isUrban && <SignRivets />}
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <Textarea 
                      placeholder="What's happening in your shop?" 
                      value={newPostContent} 
                      onChange={(e) => setNewPostContent(e.target.value)} 
                      className={cn(
                        "min-h-[100px] rounded-xl border font-medium p-4 text-sm",
                        is8BitTheme && "bg-black text-white border-none shadow-[inner_4px_4px_0_0_#000] rounded-none",
                        isHacked && "bg-black text-[#00FF41] border-[#00FF41]/30 rounded-none font-mono",
                        isGlitchProtocol && "bg-zinc-950 text-white border-red-600/20 rounded-none font-mono",
                        isNeonSyndicate && "bg-zinc-950 text-white border-cyan-500/20 rounded-none",
                        isComicBook && "bg-white dark:bg-zinc-800 text-black dark:text-white border-black border-2 rounded-none",
                        isUrban && "bg-zinc-50 text-black border-zinc-200 rounded-none shadow-inner"
                      )}
                    />
                    <div className="flex justify-end pt-1">
                      <Button 
                        type="submit" 
                        disabled={isPosting || !newPostContent.trim()} 
                        className={cn(
                          "font-black uppercase h-12 px-8 text-[10px] tracking-widest transition-all",
                          is8BitTheme ? "bg-[#ff2e88] text-white rounded-none shadow-[4px_4px_0_0_#000]" :
                          isHacked ? "bg-[#00FF41] text-black rounded-none" : 
                          isGlitchProtocol ? "bg-red-600 text-white rounded-none italic shadow-[0_0_15px_red]" :
                          isNeonSyndicate ? "bg-cyan-400 text-black rounded-none italic" :
                          isComicBook ? "bg-yellow-400 text-black border-[3px] border-black rounded-none shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]" :
                          isUrban ? "bg-black text-white rounded-none border-none shadow-lg h-10 px-6" :
                          "bg-accent text-white rounded-lg h-10"
                        )}
                      >
                        {isPosting ? <Loader2 className="animate-spin" /> : "Post Update"}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}
              <div className="space-y-4">
                {posts?.map(post => (
                  <Card key={post.id} className={cn(
                    "p-4 md:p-6 rounded-[1.5rem] bg-card border-none shadow-md relative",
                    is8BitTheme ? "bg-[#0a0a1a] text-white shadow-[6px_6px_0_0_#000] border-none rounded-none" :
                    isHacked ? "bg-black border border-[#00FF41]/10 rounded-none text-[#00FF41]/80 font-mono" : 
                    isGlitchProtocol ? "bg-zinc-800 border border-red-600/10 rounded-none text-white font-mono" :
                    isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/10 rounded-none text-white" : 
                    isComicBook ? "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none shadow-[8px_8px_0px_#000] dark:shadow-[10px_10px_0px_#fff] text-black dark:text-white" : 
                    isUrban ? "bg-white border-[2px] border-zinc-200 rounded-none text-black shadow-xl" : ""
                  )}>
                    {isUrban && <SignRivets />}
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 border">
                        <AvatarImage src={post.authorAvatar || getRandomAvatar(post.authorId)} />
                        <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={cn("font-black text-xs md:text-sm uppercase", is8BitTheme && "text-[#00f0ff]", isHacked && "text-[#00FF41]", isNeonSyndicate && "text-cyan-400", isGlitchProtocol && "text-red-600", isUrban && "text-black")}>@{post.authorName}</p>
                        <p className="text-[8px] text-zinc-400 font-black uppercase flex items-center gap-1.5 mt-0.5"><Clock className="w-3 h-3" /> {post.timestamp?.toDate ? new Date(post.timestamp.toDate()).toLocaleDateString() : 'Just now'}</p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm md:base leading-relaxed font-medium italic",
                      is8BitTheme && "text-zinc-300 font-bold",
                      isHacked && "text-[#00FF41]/60 font-mono",
                      isGlitchProtocol && "text-red-600/80 font-mono",
                      isNeonSyndicate && "text-white/80",
                      isUrban && "text-zinc-600"
                    )}>
                      {post.content}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="about">
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className={cn(
                "rounded-[1.5rem] border-none shadow-xl relative",
                is8BitTheme ? "bg-[#0a0a1a] border-none text-white shadow-[15px_15px_0_0_#000] rounded-none" :
                isHacked ? "bg-black border-2 border-[#00FF41]/20 rounded-none text-[#00FF41]" : 
                isGlitchProtocol ? "bg-zinc-800 border-2 border-red-600/20 rounded-none text-white shadow-[0_0_20px_rgba(220,38,38,0.1)]" :
                isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/20 rounded-none text-white" :
                isComicBook ? "bg-white dark:bg-zinc-900 border-[6px] border-black rounded-none shadow-[15px_15px_0px_#000] dark:shadow-[15px_15px_0px_#fff] text-black dark:text-white" :
                isUrban ? "bg-white border-[4px] border-zinc-200 text-black rounded-none shadow-2xl" :
                "bg-white dark:bg-zinc-900"
              )}>
                {isUrban && <SignRivets />}
                <CardContent className="p-8 md:p-12 space-y-6">
                  <div className="space-y-4">
                    <h3 className={cn(
                      "text-xl md:text-2xl font-headline font-black uppercase italic tracking-tight",
                      is8BitTheme && "text-[#ff2e88]",
                      isHacked && "text-[#00FF41]",
                      isGlitchProtocol && "text-red-600",
                      isNeonSyndicate && "text-cyan-400",
                      isUrban && "text-black"
                    )}>
                      About the Seller
                    </h3>
                    <div className={cn(
                      "font-medium leading-relaxed italic text-base md:text-lg",
                      is8BitTheme && "text-zinc-300 font-bold",
                      isHacked && "text-[#00FF41]/60 font-mono",
                      isGlitchProtocol && "text-red-600/70 font-mono",
                      isNeonSyndicate && "text-white/70",
                      isUrban && "text-zinc-600"
                    )}>
                      {storeData.description ? `"${storeData.description}"` : "This seller hasn’t added an about section yet."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="max-w-2xl mx-auto space-y-4">
              {reviews && reviews.length > 0 ? (
                reviews.map(r => (
                  <Card key={r.id} className={cn(
                    "p-6 md:p-8 space-y-4 border-none shadow-lg rounded-[1.5rem] relative",
                    is8BitTheme ? "bg-black shadow-[8px_8px_0_0_#000] rounded-none text-white border-none" :
                    isHacked ? "bg-black border border-[#00FF41]/10 rounded-none text-[#00FF41]/80 font-mono" : 
                    isGlitchProtocol ? "bg-zinc-800 border border-red-600/10 rounded-none text-white font-mono" :
                    isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/10 rounded-none text-white" :
                    isComicBook ? "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] text-black dark:text-white" :
                    isUrban ? "bg-white border-[2px] border-zinc-200 text-black rounded-none shadow-xl" :
                    "bg-white dark:bg-zinc-900"
                  )}>
                    {isUrban && <SignRivets />}
                    <div className="flex items-center justify-between">
                      <p className={cn("font-black uppercase text-[10px] md:text-xs tracking-widest", is8BitTheme && "text-[#ff2e88]", isHacked && "text-[#00FF41]", isGlitchProtocol && "text-red-600", isNeonSyndicate && "text-cyan-400", isUrban && "text-black")}>@{r.buyerName?.toUpperCase()}</p>
                      <div className="flex gap-0.5 text-yellow-500">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={cn("w-3.5 h-3.5 md:w-4 md:h-4 fill-current", s < r.rating ? "text-yellow-500" : "text-zinc-200")} />
                        ))}
                      </div>
                    </div>
                    <p className={cn(
                      "italic font-medium text-sm md:base leading-tight",
                      is8BitTheme && "text-zinc-400 font-bold",
                      isHacked ? "text-[#00FF41]/80" : 
                      isGlitchProtocol ? "text-red-600/80" :
                      isNeonSyndicate ? "text-white/70" :
                      isUrban ? "text-zinc-600" :
                      "text-zinc-700 dark:text-zinc-300"
                    )}>
                      {r.comment}
                    </p>
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center font-black uppercase text-[10px] tracking-[0.3em] border-2 border-solid rounded-[2rem] text-zinc-400">
                  NO_REVIEWS_LOGGED
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
