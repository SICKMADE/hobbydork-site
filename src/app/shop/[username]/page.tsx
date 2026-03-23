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

  const [bannerSrc, setBannerSrc] = useState<string>('/hobbydork-banner-default.jpg');
  const [avatarSrc, setAvatarSrc] = useState<string>(() => getRandomAvatar(username));

  const visibleListings = listings?.filter(listing => {
    const isOwner = user?.uid === listing.listingSellerId;
    if (isOwner) return true;
    return listing.visibility === 'Visible';
  }) || [];

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
      setBannerSrc(storeData?.bannerUrl || '/hobbydork-banner-default.jpg');
      
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
    const url = `${window.location.origin}/shop/${username}`;
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
  const isGameTheme = appliedTheme === 'NES ORIGINAL THEME';
  const isGlitchProtocol = appliedTheme === 'Glitch Protocol Theme';
  const isVoidShard = appliedTheme === 'Void Shard Theme';
  const isHacked = appliedTheme === 'HACKED THEME';
  
  const activeListings = visibleListings?.filter((listing) => !isListingExpired(listing));

  return (
    <div className={cn(
      "min-h-screen transition-all duration-500 relative pb-20", 
      isNeonSyndicate && "bg-zinc-950", 
      isComicBook && "bg-background dark:bg-zinc-900 comic-dots", 
      isUrban && "bg-[url('/wall.jpg')] bg-cover bg-fixed bg-center",
      isGameTheme && "bg-[#cccccc]",
      (isGlitchProtocol || isVoidShard || isHacked) && "bg-zinc-950"
    )}>
      {isGlitchProtocol && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden mix-blend-overlay opacity-30">
          <div className="w-full h-[2px] bg-red-600 shadow-[0_0_15px_red] animate-scanline absolute top-0" />
          <div className="w-full h-full animate-noise opacity-10" />
        </div>
      )}
      
      {(isVoidShard || isHacked) && <div className="fixed inset-0 pointer-events-none z-0 hardware-grid-overlay opacity-10" />}

      <Navbar />
      
      <div className={cn(
        "relative w-full h-32 md:h-56 overflow-hidden",
        isComicBook && "border-b-2 border-black", 
        isNeonSyndicate && "border-b border-cyan-500/20 bg-slate-900", 
        isGameTheme && "border-b-4 border-black bg-[#707070]",
        isGlitchProtocol && "border-b-2 border-red-600 bg-zinc-950",
        isVoidShard && "border-b border-violet-500/20 bg-slate-900",
        isHacked && "border-b-2 border-[#00FF41] bg-slate-900"
      )}>
        <Image 
          src={bannerSrc} 
          alt="" 
          fill 
          className="object-cover" 
          priority 
          onError={() => setBannerSrc('/hobbydork-banner-default.jpg')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <section className={cn(
        "container mx-auto px-4 max-w-6xl relative z-20 pb-6",
        "-mt-8 md:-mt-16"
      )}>
        {storeData.vacationMode && (
          <div className="mb-4 animate-in slide-in-from-top duration-500">
            <Card className="bg-amber-500 text-zinc-900 border-none rounded-xl p-3 flex items-center justify-center gap-3 shadow-xl">
              <p className="font-black uppercase text-[9px] tracking-widest">Dealer is currently away. New purchases are temporarily paused.</p>
            </Card>
          </div>
        )}

        <div className={cn(
          "p-4 md:p-8 rounded-[1rem] md:rounded-[1.5rem] shadow-xl transition-all overflow-hidden relative", 
          isComicBook ? "bg-white dark:bg-zinc-900 border-[6px] border-black rounded-none shadow-[15px_15px_0px_#000] dark:shadow-[15px_15px_0px_#fff] text-black dark:text-white" : 
          isNeonSyndicate ? "bg-zinc-900/80 backdrop-blur-xl border border-cyan-500/30" : 
          isUrban ? "bg-white dark:bg-zinc-900 border-[10px] border-zinc-950 dark:border-zinc-800 rounded-none text-zinc-950 dark:text-white shadow-[20px_20px_0px_#000] hover:translate-y-[-6px] hover:shadow-[30px_30px_0px_#000]" : 
          isGameTheme ? "bg-[#eeeeee] dark:bg-zinc-800 border-[4px] border-black rounded-none text-black dark:text-white shadow-[10px_10px_0_0_#000]" :
          isGlitchProtocol ? "bg-zinc-900/95 backdrop-blur-md border-2 border-red-600 rounded-none text-white shadow-[0_0_40px_rgba(220,38,38,0.2)]" :
          isVoidShard ? "bg-zinc-900/60 backdrop-blur-3xl border-2 border-violet-500/20 rounded-none text-white shadow-[0_0_40px_rgba(139,92,246,0.3)]" :
          isHacked ? "bg-black border-2 border-[#00FF41] rounded-none text-[#00FF41] font-mono" :
          "bg-card border"
        )}>
            <div className="flex flex-col lg:flex-row gap-6 md:gap-10 items-center lg:items-start relative z-10 w-full">
               <div className={cn(
                 "w-24 h-24 md:w-40 md:h-40 rounded-xl md:rounded-[1.5rem] overflow-hidden border-2 border-white shadow-xl relative shrink-0 bg-zinc-100", 
                 isComicBook && "border-4 border-black rounded-none shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]", 
                 isUrban && "border-[10px] border-zinc-950 dark:border-zinc-800 rounded-none",
                 isGameTheme && "border-[4px] border-black rounded-none",
                 isGlitchProtocol && "border-2 border-red-600 rounded-none animate-crt",
                 isHacked && "border-2 border-[#00FF41] rounded-none",
                 isNeonSyndicate && "border-2 border-cyan-400 shadow-[0_0_20px_cyan]"
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
                          "text-2xl sm:text-3xl md:text-5xl font-headline font-black uppercase tracking-tighter leading-none", 
                          isComicBook ? "text-black bg-yellow-400 border-[3px] border-black px-4 py-1 -rotate-1 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]" : 
                          isNeonSyndicate ? "text-white italic tracking-[0.1em] drop-shadow-[0_0_15px_rgba(34,211,238,1)]" : 
                          isUrban ? "text-zinc-950 dark:text-white font-black text-5xl" : 
                          isGameTheme ? "text-black dark:text-white text-4xl md:text-7xl italic" :
                          isGlitchProtocol ? "text-white italic tracking-tighter text-4xl animate-glitch-tactical animate-rgb-tactical" :
                          isVoidShard ? "text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" :
                          isHacked ? "text-[#00FF41] font-mono text-4xl md:text-7xl" :
                          "text-primary"
                        )}>
                          {username}
                        </h1>
                        <ShieldCheck className={cn("w-6 h-6 md:w-10 md:h-10", isGameTheme ? "text-red-600" : isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : "text-primary")} />
                        {sellerProfile?.vaultUnlocked && (
                          <Badge className="bg-amber-500 text-zinc-950 border-none font-black uppercase text-[8px] tracking-widest gap-1 shadow-lg">
                            <Crown className="w-2.5 h-2.5" /> VAULT_LEGACY
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "font-bold text-sm md:text-lg uppercase tracking-[0.2em] italic", 
                        isHacked ? "text-[#00FF41]/60 font-mono" : 
                        isNeonSyndicate ? "text-cyan-400/60" :
                        isGlitchProtocol ? "text-red-600/60 font-mono" :
                        "text-muted-foreground dark:text-white/60"
                      )}>
                        {storeData?.tagline || 'Verified Dealer'}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-8 pt-2">
                      <div className="space-y-1">
                        <p className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-50", isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : "text-muted-foreground")}>Health Status</p>
                        <TierBadge tier={sellerProfile?.sellerTier} />
                      </div>
                      <div className="space-y-1">
                        <p className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-50", isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : "text-muted-foreground")}>Trades</p>
                        <div className="flex items-center gap-2">
                          <History className={cn("w-4 h-4", isHacked ? "text-[#00FF41]" : isNeonSyndicate ? "text-cyan-400" : isGlitchProtocol ? "text-red-600" : "text-accent")} />
                          <span className={cn("font-black text-sm md:text-lg", isHacked && "font-mono", isNeonSyndicate && "text-white")}>{sellerProfile?.completedOrders || 0}</span>
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
                      "bg-muted/50 dark:bg-zinc-800 border-border dark:border-white/10"
                    )}>
                      <code className={cn(
                        "text-[9px] md:text-xs font-mono font-bold truncate flex-1",
                        isHacked ? "text-[#00FF41]" : 
                        isNeonSyndicate ? "text-cyan-400" :
                        isGlitchProtocol ? "text-red-600" :
                        "text-muted-foreground dark:text-white/60"
                      )}>
                        hobbydork.com/shop/{username}
                      </code>
                      <button title="Copy Link" onClick={handleCopyUrl} className="h-8 w-8 hover:bg-accent/10 flex items-center justify-center rounded-lg transition-colors">
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
                          isGameTheme ? "bg-[#ff0000] text-white rounded-full border-none shadow-[0_4px_0_0_#a00000]" :
                          isHacked ? "bg-[#00FF41] text-black rounded-none font-mono" :
                          isGlitchProtocol ? "bg-red-600 text-white rounded-none italic shadow-[0_0_15px_red]" :
                          isNeonSyndicate ? "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_20px_cyan] rounded-none italic" :
                          isComicBook ? "bg-yellow-400 text-black border-[3px] border-black rounded-none shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000] dark:hover:shadow-[8px_8px_0px_#fff]" :
                          "bg-primary text-white rounded-lg shadow-lg"
                        )}
                      >
                        {isFollowing ? 'Following' : 'Follow Dealer'}
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
            isGameTheme ? "bg-[#707070] border-black rounded-none h-16 shadow-[6px_6px_0_0_#000] border-[3px]" :
            isHacked ? "bg-black border-[#00FF41] rounded-none h-16 font-mono" : 
            isGlitchProtocol ? "bg-zinc-950 border-2 border-red-600 rounded-none h-16" :
            isNeonSyndicate ? "bg-zinc-900 border-cyan-500/20 rounded-none h-16" :
            isComicBook ? "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none h-16 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]" :
            "bg-muted dark:bg-zinc-800 shadow-inner"
          )}>
            {[
              { id: 'listings', label: 'Inventory', icon: LayoutGrid },
              { id: 'giveaways', label: 'Drops', icon: Zap },
              { id: 'feed', label: 'Feed', icon: Activity },
              { id: 'about', label: 'About', icon: Shield },
              { id: 'reviews', label: 'Reviews', icon: Star },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className={cn(
                  "px-6 md:px-10 h-full font-black uppercase text-[9px] md:text-[11px] tracking-[0.2em] transition-all duration-300 gap-2 shrink-0",
                  isGameTheme ? "rounded-none text-white data-[state=active]:text-white data-[state=active]:bg-black data-[state=active]:border-b-2 data-[state=active]:border-red-600" :
                  isHacked ? "rounded-none text-[#00FF41]/40 data-[state=active]:text-black data-[state=active]:bg-[#00FF41]" : 
                  isGlitchProtocol ? "rounded-none text-red-600/40 data-[state=active]:text-white data-[state=active]:bg-red-600 data-[state=active]:animate-pulse" :
                  isNeonSyndicate ? "rounded-none text-cyan-400/40 data-[state=active]:text-white data-[state=active]:bg-cyan-400/10 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400" :
                  isComicBook ? "rounded-none text-black dark:text-white data-[state=active]:bg-yellow-400 data-[state=active]:text-black" :
                  "data-[state=active]:bg-background dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-md"
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="listings">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-12 md:gap-x-4 md:gap-y-20">
              {activeListings && activeListings.length > 0 ? (
                activeListings.map((l) => <ListingCard key={l.id} listing={l} theme={appliedTheme} />)
              ) : (
                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-[2rem] font-black uppercase text-[10px] tracking-widest text-zinc-400">NO_ITEMS_LOADED</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="giveaways">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {giveaways && giveaways.length > 0 ? (
                giveaways.map((g) => <GiveawayCard key={g.id} giveaway={g} theme={appliedTheme} />)
              ) : (
                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-[2rem] font-black uppercase text-[10px] tracking-widest text-zinc-400">NO_DROPS_ACTIVE</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="feed">
            <div className="max-w-2xl mx-auto space-y-6">
              {isOwner && (
                <Card className={cn(
                  "p-4 md:p-6 rounded-[1.5rem] border-none shadow-xl",
                  isGameTheme ? "bg-[#eeeeee] dark:bg-zinc-800 border-[4px] border-black rounded-none shadow-[6px_6px_0_0_#000]" :
                  isHacked ? "bg-black border border-[#00FF41]/30 rounded-none" : 
                  isGlitchProtocol ? "bg-zinc-900 border border-red-600/30 rounded-none shadow-[0_0_30px_rgba(220,38,38,0.1)]" :
                  isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/20 rounded-none" : 
                  isComicBook ? "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none shadow-[10px_10px_0px_#000] dark:shadow-[10px_10px_0px_#fff]" : ""
                )}>
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <Textarea 
                      placeholder="What's happening in your shop?" 
                      value={newPostContent} 
                      onChange={(e) => setNewPostContent(e.target.value)} 
                      className={cn(
                        "min-h-[100px] rounded-xl border font-medium p-4 text-sm",
                        isHacked && "bg-black text-[#00FF41] border-[#00FF41]/30 rounded-none font-mono",
                        isGlitchProtocol && "bg-zinc-950 text-white border-red-600/20 rounded-none font-mono",
                        isNeonSyndicate && "bg-zinc-950 text-white border-cyan-500/20 rounded-none",
                        isComicBook && "bg-white dark:bg-zinc-800 text-black dark:text-white border-black border-2 rounded-none"
                      )}
                    />
                    <div className="flex justify-end pt-1">
                      <Button 
                        type="submit" 
                        disabled={isPosting || !newPostContent.trim()} 
                        className={cn(
                          "font-black uppercase h-12 px-8 text-[10px] tracking-widest transition-all",
                          isGameTheme ? "bg-[#ff0000] text-white rounded-full shadow-[0_4px_0_0_#a00000]" :
                          isHacked ? "bg-[#00FF41] text-black rounded-none" : 
                          isGlitchProtocol ? "bg-red-600 text-white rounded-none italic shadow-[0_0_15px_red]" :
                          isNeonSyndicate ? "bg-cyan-400 text-black rounded-none italic" :
                          isComicBook ? "bg-yellow-400 text-black border-[3px] border-black rounded-none shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]" :
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
                    "p-4 md:p-6 rounded-[1.5rem] bg-card border-none shadow-md",
                    isHacked ? "bg-black border border-[#00FF41]/10 rounded-none text-[#00FF41]/80 font-mono" : 
                    isGlitchProtocol ? "bg-zinc-900 border border-red-600/10 rounded-none text-white font-mono" :
                    isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/10 rounded-none text-white" : 
                    isComicBook ? "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] text-black dark:text-white" : ""
                  )}>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 border">
                        <AvatarImage src={post.authorAvatar || getRandomAvatar(post.authorId)} />
                        <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={cn("font-black text-xs md:text-sm uppercase", isHacked && "text-[#00FF41]", isNeonSyndicate && "text-cyan-400", isGlitchProtocol && "text-red-600")}>@{post.authorName}</p>
                        <p className="text-[8px] text-zinc-400 font-black uppercase flex items-center gap-1.5 mt-0.5"><Clock className="w-3 h-3" /> {post.timestamp?.toDate ? new Date(post.timestamp.toDate()).toLocaleDateString() : 'Just now'}</p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm md:base leading-relaxed font-medium italic",
                      isHacked && "text-[#00FF41]/60 font-mono",
                      isGlitchProtocol && "text-red-600/80 font-mono",
                      isNeonSyndicate && "text-white/80"
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
                "rounded-[1.5rem] border-none shadow-xl overflow-hidden",
                isGameTheme ? "bg-[#eeeeee] dark:bg-zinc-800 border-[6px] border-black rounded-none text-black dark:text-white shadow-[10px_10px_0_0_#000]" :
                isHacked ? "bg-black border-2 border-[#00FF41]/20 rounded-none text-[#00FF41]" : 
                isGlitchProtocol ? "bg-zinc-900 border-2 border-red-600/20 rounded-none text-white shadow-[0_0_20px_rgba(220,38,38,0.1)]" :
                isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/20 rounded-none text-white" :
                isComicBook ? "bg-white dark:bg-zinc-900 border-[6px] border-black rounded-none shadow-[15px_15px_0px_#000] dark:shadow-[15px_15px_0px_#fff] text-black dark:text-white" :
                "bg-white dark:bg-zinc-900"
              )}>
                <CardContent className="p-8 md:p-12 space-y-6">
                  <div className="space-y-4">
                    <h3 className={cn(
                      "text-xl md:text-2xl font-headline font-black uppercase italic tracking-tight",
                      isHacked && "text-[#00FF41]",
                      isGlitchProtocol && "text-red-600",
                      isNeonSyndicate && "text-cyan-400"
                    )}>
                      About the Shop
                    </h3>
                    <div className={cn(
                      "font-medium leading-relaxed italic text-base md:text-lg",
                      isHacked && "text-[#00FF41]/60 font-mono",
                      isGlitchProtocol && "text-red-600/70 font-mono",
                      isNeonSyndicate && "text-white/70"
                    )}>
                      {storeData.description ? `"${storeData.description}"` : "The dealer profile remains hidden."}
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
                    "p-6 md:p-8 space-y-4 border-none shadow-lg rounded-[1.5rem]",
                    isHacked ? "bg-black border border-[#00FF41]/10 rounded-none text-[#00FF41]/80 font-mono" : 
                    isGlitchProtocol ? "bg-zinc-950 border border-red-600/10 rounded-none text-white font-mono" :
                    isNeonSyndicate ? "bg-zinc-900 border border-cyan-500/10 rounded-none text-white" :
                    isComicBook ? "bg-white dark:bg-zinc-900 border-[4px] border-black rounded-none shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] text-black dark:text-white" :
                    "bg-white dark:bg-zinc-900"
                  )}>
                    <div className="flex items-center justify-between">
                      <p className={cn("font-black uppercase text-[10px] md:text-xs tracking-widest", isHacked && "text-[#00FF41]", isGlitchProtocol && "text-red-600", isNeonSyndicate && "text-cyan-400")}>@{r.buyerName?.toUpperCase()}</p>
                      <div className="flex gap-0.5 text-yellow-500">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={cn("w-3.5 h-3.5 md:w-4 md:h-4 fill-current", s < r.rating ? "text-yellow-500" : "text-zinc-200")} />
                        ))}
                      </div>
                    </div>
                    <p className={cn(
                      "italic font-medium text-sm md:base leading-tight",
                      isHacked ? "text-[#00FF41]/80" : 
                      isGlitchProtocol ? "text-red-600/80" :
                      isNeonSyndicate ? "text-white/70" :
                      "text-zinc-700 dark:text-zinc-300"
                    )}>
                      {r.comment}
                    </p>
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center font-black uppercase text-[10px] tracking-[0.3em] border-2 border-dashed rounded-[2rem] text-zinc-400">
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