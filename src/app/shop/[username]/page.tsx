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
  ArrowRight,
  MessageSquare,
  Heart,
  Loader2,
  Clock,
  Ghost,
  Users,
  CheckCircle2,
  Medal,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn, getRandomAvatar, filterProfanity } from '@/lib/utils';
import type { Listing, Giveaway } from '@/lib/mock-data';
import { isListingExpired } from '@/lib/mock-data';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, addDoc, serverTimestamp, setDoc, deleteDoc, getDoc, updateDoc, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ShopPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(true);

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
    return query(collection(db, 'reviews'), where('sellerId', '==', sellerProfile.uid));
  }, [db, sellerProfile?.uid]);

  const postsQuery = useMemoFirebase(() => db ? query(collection(db, 'storefronts', username, 'posts'), orderBy('timestamp', 'desc')) : null, [db, username]);

  const { data: listings } = useCollection<Listing>(listingsQuery as any);
  const { data: giveaways } = useCollection<Giveaway>(giveawaysQuery as any);
  const { data: reviews } = useCollection(reviewsQuery);
  const { data: posts } = useCollection(postsQuery);

  const visibleListings = listings?.filter(listing => {
    const isOwner = user?.uid === listing.listingSellerId;
    if (isOwner) return true;
    return listing.visibility === 'Visible';
  }) || [];

  useEffect(() => {
    if (!db || !user || !username) {
      setIsFollowLoading(false);
      return;
    }
    const followId = `${user.uid}_${username}`;
    const followRef = doc(db, 'followers', followId);
    
    getDoc(followRef).then(snap => {
      setIsFollowing(snap.exists());
      setIsFollowLoading(false);
    });
  }, [db, user, username]);

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
    if (!newPostContent.trim() || !user || !db || !storeRef) return;

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
    const avatarUrl = currentUserProfile?.photoURL?.startsWith('data:') ? currentUserProfile.photoURL : getRandomAvatar(user.uid);

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
      toast({
        variant: 'destructive',
        title: 'Post Failed',
        description: 'Could not publish your post. Please try again.'
      });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `storefronts/${username}/posts`,
        operation: 'create',
        requestResourceData: postData
      }));
    } finally {
      setIsPosting(false);
    }
  };

  const handleRelist = async (listing: Listing) => {
    if (!db) return;
    try {
      const ref = doc(db, 'listings', listing.id);
      await updateDoc(ref, {
        status: 'Active',
        visibility: 'Visible',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        updatedAt: serverTimestamp()
      });
      toast({ title: 'Item Relisted' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Relist Failed' });
    }
  };

  if (storeLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  if (!storeData) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><Ghost className="w-12 h-12 text-muted-foreground" /><h1 className="text-xl font-black uppercase">Store Not Found</h1><Button asChild variant="outline"><Link href="/">Back Home</Link></Button></div>;

  const isOwner = user?.uid === storeData.ownerUid;
  const appliedTheme = storeData?.theme || 'Default';
  const isComicBook = appliedTheme === 'Comic Book Theme';
  const isNeonSyndicate = appliedTheme === 'Neon Syndicate Theme';
  const isUrban = appliedTheme === 'Urban Theme';
  const isHobbyShop = appliedTheme === 'Hobby Shop Theme';
  const avatarUrl = storeData.avatarUrl || getRandomAvatar(username);

  const activeListings = visibleListings?.filter((listing) => !isListingExpired(listing));
  const expiredListings = listings?.filter((listing) => isListingExpired(listing));

  const urbanTabTriggerClass = cn(
    "px-6 md:px-8 h-full font-black uppercase text-[9px] md:text-[10px] tracking-widest relative transition-all",
    isUrban && "text-white/60 data-[state=active]:text-white data-[state=active]:bg-transparent",
    isUrban && "data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:inset-x-1 data-[state=active]:after:inset-y-1 data-[state=active]:after:border-[3px] data-[state=active]:after:border-white/90 data-[state=active]:after:rounded-[48%_52%_50%_50%/45%_55%_55%_45%] data-[state=active]:after:rotate-[-2deg] data-[state=active]:after:pointer-events-none data-[state=active]:after:blur-[1.2px]",
  );

  return (
    <div className={cn("min-h-screen bg-background transition-colors duration-500", isNeonSyndicate && "bg-zinc-950", isComicBook && "comic-dots bg-white", isUrban && "bg-[url('/brick-wall.png')] bg-repeat bg-[size:250px]")}>
      <Navbar />
      <div className={cn("relative w-full h-48 md:h-80 overflow-hidden bg-slate-900", isComicBook && "border-b-[8px] border-black", isNeonSyndicate && "border-b border-cyan-500/20", isUrban && "border-b-4 border-slate-900", isHobbyShop && "border-b-4 border-[#5d4037]")}>
        <Image src={storeData.bannerUrl || '/hobbydork-banner-default.png'} alt={`${username} banner`} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <section className="container mx-auto px-4 max-w-6xl -mt-12 md:-mt-20 relative z-20 pb-8">
        <div className={cn("flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl transition-all", isComicBook ? "bg-white border-[6px] border-black rounded-none shadow-[15px_15px_0px_#000]" : isNeonSyndicate ? "bg-zinc-900/80 backdrop-blur-xl border border-cyan-500/30" : isUrban ? "bg-slate-100 border-4 border-slate-900 rounded-none shadow-[10px_10px_0px_#000]" : isHobbyShop ? "bg-[#355e3b] border-4 border-white/10 text-white" : "bg-card border")}>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
               <div className={cn("w-24 h-24 md:w-40 md:h-40 rounded-2xl md:rounded-3xl overflow-hidden border-4 border-white shadow-xl relative shrink-0 bg-zinc-100", isComicBook && "border-4 border-black rounded-none shadow-[8px_8px_0px_#000]", isUrban && "border-4 border-slate-900 rounded-none")}>
                  <Image src={avatarUrl} alt={username} fill className="object-cover" />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 flex-wrap">
                    <h1 className={cn("text-xl sm:text-2xl md:text-5xl font-headline font-black uppercase tracking-tighter", isComicBook ? "text-black bg-yellow-400 border-4 border-black px-3 py-1" : isNeonSyndicate ? "text-white italic tracking-[0.1em] drop-shadow-[0_0_10px_cyan]" : isUrban ? "text-slate-950 font-['Graffiti'] text-4xl md:text-7xl lowercase" : isHobbyShop ? "text-white" : "text-primary")}>{username}</h1>
                    <ShieldCheck className={cn("w-6 h-6 md:w-8 md:h-8", isNeonSyndicate ? "text-cyan-400" : isHobbyShop ? "text-white" : "text-primary")} />
                    {sellerProfile?.sellerTier && <Badge className="gap-1.5 font-black uppercase text-[9px] md:text-[10px] tracking-widest"><Medal className="w-3.5 h-3.5" />{sellerProfile.sellerTier}</Badge>}
                  </div>
                  <p className={cn("font-bold text-xs md:text-sm uppercase tracking-widest", isNeonSyndicate ? "text-cyan-400/60" : isHobbyShop ? "text-white/70" : "text-muted-foreground")}>{storeData?.tagline || 'Verified Dealer'}</p>
                  <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 text-[9px] md:text-[10px] font-black uppercase"><span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> 5.0 Rating</span><span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {storeData?.totalSales || 0} Sales</span></div>
                </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              {!isOwner && (
                <div className="flex gap-2 w-full md:w-auto">
                  <Button onClick={handleFollowToggle} disabled={isFollowLoading} className={cn("font-black px-8 md:px-12 h-12 md:h-14 uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 flex-1 md:flex-none", isFollowing ? "bg-zinc-200 text-zinc-600" : "bg-primary text-white")}>{isFollowing ? 'Following' : 'Follow'}</Button>
                  <Button asChild variant="outline" className="h-12 md:h-14 rounded-xl md:rounded-2xl border-2 font-black uppercase text-[10px] gap-2 px-6"><Link href={`/messages?seller=${username}`}><MessageSquare className="w-4 h-4" /> Message</Link></Button>
                </div>
              )}
              {isOwner && <Link href="/seller/settings" className="w-full sm:w-auto"><Button className="w-full sm:w-auto px-6 md:px-8 h-12 md:h-14 font-black uppercase tracking-widest rounded-xl border-2 text-[10px]">Edit Shop Appearance</Button></Link>}
            </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        <Tabs defaultValue="listings" className="space-y-6 md:space-y-10">
          <TabsList className={cn("p-1 h-12 md:h-14 border w-full sm:w-auto justify-start flex-nowrap scrollbar-hide", isUrban ? "bg-black/60 border-white/20 rounded-none" : "rounded-xl md:rounded-2xl bg-muted")}>
            <TabsTrigger value="listings" className={urbanTabTriggerClass}>listings</TabsTrigger>
            {isOwner && <TabsTrigger value="expired" className={urbanTabTriggerClass}>expired</TabsTrigger>}
            <TabsTrigger value="giveaways" className={urbanTabTriggerClass}>giveaways</TabsTrigger>
            <TabsTrigger value="feed" className={urbanTabTriggerClass}>feed</TabsTrigger>
            <TabsTrigger value="reviews" className={urbanTabTriggerClass}>reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-24 md:gap-x-4 md:gap-y-32">
              {activeListings && activeListings.length > 0 ? (activeListings.map((l) => <ListingCard key={l.id} listing={l} theme={appliedTheme} />)) : (<div className="col-span-full py-20 text-center border-4 border-dashed rounded-[2rem] text-zinc-400 font-black uppercase text-sm">No active listings</div>)}
            </div>
          </TabsContent>

          {isOwner && (
            <TabsContent value="expired">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-24 md:gap-x-4 md:gap-y-32">
                {expiredListings?.map((l) => (
                  <div key={l.id} className="relative group">
                    <ListingCard listing={l} theme={appliedTheme} />
                    <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"><Button size="sm" onClick={() => handleRelist(l)} className="bg-green-600 hover:bg-green-700 text-white uppercase text-[10px] font-black"><RotateCcw className="w-3 h-3 mr-1" /> Relist</Button></div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="giveaways">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {giveaways?.map((g) => <GiveawayCard key={g.id} giveaway={g} theme={appliedTheme} />)}
            </div>
          </TabsContent>

          <TabsContent value="feed">
            <div className="max-w-3xl mx-auto space-y-6">
              {isOwner && (
                <Card className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl">
                  {user && !user.emailVerified ? (
                    <div className="flex items-center justify-center p-8 bg-muted/20 rounded-2xl border-2 border-dashed gap-3 text-muted-foreground font-black uppercase text-xs">
                      <ShieldAlert className="w-5 h-5 text-accent" /> Verify email to post updates
                    </div>
                  ) : (
                    <form onSubmit={handleCreatePost} className="space-y-4">
                      <Textarea placeholder="What's happening in your shop?" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="min-h-[100px] rounded-xl border-2 font-medium" />
                      <div className="flex justify-end"><Button type="submit" disabled={isPosting || !newPostContent.trim()} className="font-black uppercase bg-accent text-white">{isPosting ? <Loader2 className="animate-spin" /> : "Post Update"}</Button></div>
                    </form>
                  )}
                </Card>
              )}
              {posts?.map(post => (
                <Card key={post.id} className="p-4 md:p-6 rounded-[1.5rem] bg-card border-none shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-8 md:w-10 h-8 md:h-10 border-2 border-white"><AvatarImage src={post.authorAvatar || getRandomAvatar(post.authorId)} /><AvatarFallback>{post.authorName[0]}</AvatarFallback></Avatar>
                    <div><p className="font-black text-xs md:text-sm">@{post.authorName}</p><p className="text-[8px] text-zinc-400 font-black uppercase"><Clock className="w-3 h-3" /> {post.timestamp?.toDate ? new Date(post.timestamp.toDate()).toLocaleDateString() : 'Just now'}</p></div>
                  </div>
                  <p className="text-sm md:text-base leading-relaxed font-medium">"{post.content}"</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="max-w-3xl mx-auto space-y-4">
              {reviews?.map(r => (
                <Card key={r.id} className="p-6 space-y-4 border-none shadow-lg rounded-[1.5rem] bg-white">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><p className="font-black uppercase text-[10px]">@{r.buyerName}</p></div><div className="flex gap-0.5 text-yellow-500">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className="w-3 h-3 fill-current" />)}</div></div>
                  <p className="italic font-medium text-base">"{r.comment}"</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
