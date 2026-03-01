
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
  Send,
  Loader2,
  Clock,
  Ghost,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  Medal
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn, getRandomAvatar, filterProfanity } from '@/lib/utils';
import type { Listing, Giveaway } from '@/lib/mock-data';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, addDoc, serverTimestamp, setDoc, deleteDoc, getDoc, updateDoc, increment, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function ShopPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(true);

  const storeRef = useMemoFirebase(() => db ? doc(db, 'storefronts', username) : null, [db, username]);
  const { data: storeData, isLoading: storeLoading } = useDoc(storeRef);

  // Fetch current user's profile for avatar
  const currentUserProfileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: currentUserProfile } = useDoc(currentUserProfileRef);

  // Fetch seller's user profile to get tier
  const sellerUsersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('username', '==', username), limit(1)) : null, [db, username]);
  const { data: sellerUsers } = useCollection(sellerUsersQuery);
  const sellerProfile = sellerUsers?.[0];

  const listingsQuery = useMemoFirebase(() => db ? query(collection(db, 'listings'), where('seller', '==', username)) : null, [db, username]);
  const giveawaysQuery = useMemoFirebase(() => db ? query(collection(db, 'giveaways'), where('seller', '==', username)) : null, [db, username]);
  const reviewsQuery = useMemoFirebase(() => db ? query(collection(db, 'reviews'), where('sellerId', '==', username)) : null, [db, username]);
  const postsQuery = useMemoFirebase(() => db ? query(collection(db, 'storefronts', username, 'posts'), orderBy('timestamp', 'desc')) : null, [db, username]);

  const { data: listings } = useCollection<Listing>(listingsQuery as any);
  const { data: giveaways } = useCollection<Giveaway>(giveawaysQuery as any);
  const { data: reviews } = useCollection(reviewsQuery);
  const { data: posts } = useCollection(postsQuery);

  // Check Follow Status
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

    setIsPosting(true);
    const sanitized = filterProfanity(newPostContent);

    // Only use custom photo if it's a data: URL (real file upload)
    const isCustomPhoto = currentUserProfile?.photoURL && currentUserProfile.photoURL.startsWith('data:');
    const avatarUrl = isCustomPhoto ? currentUserProfile.photoURL : getRandomAvatar(user.uid);

    const postData = {
      content: sanitized,
      authorId: user.uid,
      authorName: user.displayName || username,
      authorAvatar: avatarUrl,
      timestamp: serverTimestamp(),
      likes: 0
    };

    try {
      await addDoc(collection(db, 'storefronts', username, 'posts'), postData);
      setNewPostContent('');
      toast({ title: 'Post Published!', description: 'Your followers have been notified.' });
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `storefronts/${username}/posts`,
        operation: 'create',
        requestResourceData: postData
      } satisfies SecurityRuleContext));
    } finally {
      setIsPosting(false);
    }
  };

  if (storeLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  }

  if (!storeData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Ghost className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-black uppercase">Store Not Found</h1>
        <Button asChild variant="outline"><Link href="/">Back Home</Link></Button>
      </div>
    );
  }

  const isOwner = user?.uid === storeData.ownerUid;
  const appliedTheme = storeData?.theme || 'Default';
  const isComicBook = appliedTheme === 'Comic Book Theme';
  const isNeonSyndicate = appliedTheme === 'Neon Syndicate Theme';
  const isUrban = appliedTheme === 'Urban Theme';
  const isHobbyShop = appliedTheme === 'Hobby Shop Theme';
  const avatarUrl = storeData.avatarUrl || getRandomAvatar(username);

  return (
    <div className={cn(
      "min-h-screen bg-background transition-colors duration-500",
      isNeonSyndicate && "bg-zinc-950",
      isComicBook && "comic-dots bg-white"
    )}>
      <Navbar />
      
      <div className={cn(
        "relative w-full h-48 md:h-80 overflow-hidden bg-slate-900",
        isComicBook && "border-b-[8px] border-black",
        isNeonSyndicate && "border-b border-cyan-500/20",
        isUrban && "border-b-4 border-slate-900",
        isHobbyShop && "border-b-4 border-[#5d4037]"
      )}>
        <Image 
          src={storeData.bannerUrl || '/hobbydork-banner-default.png'} 
          alt={`${username} banner`} 
          fill 
          className="object-cover" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <section className="container mx-auto px-4 max-w-6xl -mt-12 md:-mt-20 relative z-20 pb-8">
        <div className={cn(
          "flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl transition-all duration-500",
          isComicBook ? "bg-white border-[6px] border-black rounded-none shadow-[15px_15px_0px_#000]" : 
          isNeonSyndicate ? "bg-zinc-900/80 backdrop-blur-xl border border-cyan-500/30" : 
          isUrban ? "bg-slate-100 border-4 border-slate-900 rounded-none shadow-[10px_10px_0px_#000]" : 
          isHobbyShop ? "bg-[#355e3b] border-4 border-white/10 text-white" : 
          "bg-card border"
        )}>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
               <div className={cn(
                 "w-24 h-24 md:w-40 md:h-40 rounded-2xl md:rounded-3xl overflow-hidden border-4 border-white shadow-xl relative shrink-0 bg-zinc-100",
                 isComicBook && "border-4 border-black rounded-none shadow-[8px_8px_0px_#000]",
                 isUrban && "border-4 border-slate-900 rounded-none"
               )}>
                  <Image src={avatarUrl} alt={username} fill className="object-cover" />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 flex-wrap">
                    <h1 className={cn(
                      "text-xl sm:text-2xl md:text-5xl font-headline font-black uppercase tracking-tighter",
                      isComicBook ? "text-black bg-yellow-400 border-4 border-black px-3 py-1" : 
                      isNeonSyndicate ? "text-white italic tracking-[0.1em] drop-shadow-[0_0_10px_cyan]" : 
                      isUrban ? "text-slate-950 font-mono" : 
                      isHobbyShop ? "text-white" : "text-primary"
                    )}>
                      {username}
                    </h1>
                    <ShieldCheck className={cn(
                      "w-6 h-6 md:w-8 md:h-8",
                      isNeonSyndicate ? "text-cyan-400" : isHobbyShop ? "text-white" : "text-primary"
                    )} />
                    {sellerProfile?.sellerTier && (
                      <Badge className={cn(
                        "gap-1.5 font-black uppercase text-[9px] md:text-[10px] tracking-widest",
                        sellerProfile.sellerTier === 'Platinum' ? "bg-purple-600" :
                        sellerProfile.sellerTier === 'Gold' ? "bg-yellow-600" :
                        sellerProfile.sellerTier === 'Silver' ? "bg-slate-400" :
                        "bg-orange-600"
                      )}>
                        <Medal className="w-3.5 h-3.5" />
                        {sellerProfile.sellerTier}
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    "font-bold text-xs md:text-sm uppercase tracking-widest",
                    isNeonSyndicate ? "text-cyan-400/60" : isHobbyShop ? "text-white/70" : "text-muted-foreground"
                  )}>
                    {storeData?.tagline || 'Verified hobbydork Dealer'}
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 text-[9px] md:text-[10px] font-black uppercase">
                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> 5.0 Rating</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {storeData?.totalSales || 0} Sales</span>
                  </div>
                </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              {!isOwner && (
                <Button 
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={cn(
                    "font-black px-8 md:px-12 h-12 md:h-14 uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 w-full md:w-auto",
                    isFollowing ? "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600" : (
                      isComicBook ? "bg-black text-white rounded-none border-4 border-black" : 
                      isNeonSyndicate ? "bg-cyan-500 text-zinc-950 rounded-none italic shadow-[0_0_20px_rgba(34,211,238,0.4)]" : 
                      isUrban ? "bg-orange-600 text-white rounded-none border-b-4 border-r-4 border-slate-950" : 
                      isHobbyShop ? "bg-white text-[#355e3b] rounded-none" : 
                      "bg-primary text-white dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
                    )
                  )}
                >
                  {isFollowing ? 'Following' : 'Follow Shop'}
                </Button>
              )}
              {isOwner && (
                <Button asChild variant="outline" className="rounded-xl font-black h-12 px-8 uppercase text-[10px] tracking-widest border-2">
                  <Link href="/seller/settings">Edit Shop Appearance</Link>
                </Button>
              )}
            </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        {giveaways && giveaways.length > 0 && (
          <div className="mb-8 md:mb-12">
            <div className={cn(
              "rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden shadow-2xl transition-all duration-500 bg-zinc-950 text-white",
              isComicBook ? "bg-white border-[6px] border-black rounded-none text-black" : 
              isNeonSyndicate ? "border border-cyan-500/40 shadow-[0_0_40px_rgba(34,211,238,0.1)]" : 
              isUrban ? "bg-slate-900 border-4 border-slate-700 rounded-none" : 
              isHobbyShop ? "bg-[#5d4037] rounded-none border-4 border-white/10" : ""
            )}>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                <div className="space-y-2 md:space-y-4 text-center md:text-left">
                  <Badge className="bg-accent text-white uppercase font-black tracking-widest text-[8px] md:text-[9px]">Active Drop</Badge>
                  <h2 className="text-2xl md:text-5xl font-headline font-black uppercase italic tracking-tighter leading-tight md:leading-none">{giveaways[0].title}</h2>
                </div>
                <Button asChild className="h-14 md:h-16 px-8 md:px-12 rounded-xl md:rounded-2xl transition-all shadow-2xl text-lg md:text-xl uppercase italic bg-white text-zinc-950 hover:bg-accent hover:text-white w-full md:w-auto">
                  <Link href={`/giveaways/${giveaways[0].id}`}>
                    Enter Drop <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="listings" className="space-y-6 md:space-y-10">
          <TabsList className="p-1 h-12 md:h-14 rounded-xl md:rounded-2xl border overflow-x-auto justify-start flex-nowrap scrollbar-hide">
            <TabsTrigger value="listings" className="px-6 md:px-8 h-full font-black uppercase text-[9px] md:text-[10px] tracking-widest">Listings</TabsTrigger>
            <TabsTrigger value="giveaways" className="px-6 md:px-8 h-full font-black uppercase text-[9px] md:text-[10px] tracking-widest">Giveaways</TabsTrigger>
            <TabsTrigger value="feed" className="px-6 md:px-8 h-full font-black uppercase text-[9px] md:text-[10px] tracking-widest">Feed</TabsTrigger>
            <TabsTrigger value="reviews" className="px-6 md:px-8 h-full font-black uppercase text-[9px] md:text-[10px] tracking-widest">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {listings && listings.length > 0 ? (
                listings.map((listing) => <ListingCard key={listing.id} listing={listing} theme={appliedTheme} />)
              ) : (
                <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[2rem] border-zinc-100 text-zinc-400">
                  <p className="font-black uppercase text-sm">No active listings</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="giveaways">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {giveaways && giveaways.length > 0 ? (
                giveaways.map((giveaway) => <GiveawayCard key={giveaway.id} giveaway={giveaway} theme={appliedTheme} />)
              ) : (
                <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[2rem] border-zinc-100 text-zinc-400">
                  <p className="font-black uppercase text-sm">No active drops</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="feed">
            <div className="max-w-3xl mx-auto space-y-6 md:space-y-10">
              {isOwner && (
                <Card className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl">
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div className="flex gap-3 md:gap-4">
                      <Avatar className="w-10 h-10 border shadow-sm">
                        <AvatarImage src={(currentUserProfile?.photoURL && currentUserProfile.photoURL.startsWith('data:')) ? currentUserProfile.photoURL : getRandomAvatar(user?.uid)} />
                        <AvatarFallback>{(user?.displayName || 'C')[0]}</AvatarFallback>
                      </Avatar>
                      <Textarea 
                        placeholder="What's happening in your shop today?"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="min-h-[100px] rounded-xl md:rounded-2xl border-2 font-medium"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isPosting || !newPostContent.trim()} className="h-10 md:h-12 px-6 md:px-8 font-black uppercase tracking-widest bg-accent text-white">
                        {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Update"}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              <div className="space-y-4 md:space-y-6">
                {!posts || posts.length === 0 ? (
                  <div className="py-12 md:py-20 text-center border-4 border-dashed rounded-[1.5rem] md:rounded-[2.5rem] border-zinc-100 bg-zinc-50/50 space-y-4 md:space-y-6">
                    <Ghost className="w-8 md:w-10 h-8 md:h-10 text-zinc-300 mx-auto" />
                    <div className="space-y-2 max-w-sm mx-auto px-6">
                      <h3 className="font-headline font-black uppercase text-lg md:text-xl text-primary">The Vault is Quiet</h3>
                      <p className="text-xs md:text-sm font-medium leading-relaxed text-muted-foreground">Be the first to start the conversation!</p>
                    </div>
                  </div>
                ) : posts.map(post => {
                  // Only use custom photo if it's a data: URL (real file upload)
                  const isCustomAvatar = post.authorAvatar && post.authorAvatar.startsWith('data:');
                  const displayAvatar = isCustomAvatar ? post.authorAvatar : getRandomAvatar(post.authorId);

                  return (
                  <Card key={post.id} className="p-4 md:p-6 border-none shadow-lg bg-card rounded-[1.5rem] md:rounded-[2rem]">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 md:w-10 h-8 md:h-10 border-2 border-white">
                          <AvatarImage src={displayAvatar} />
                          <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-black text-xs md:text-sm text-primary">@{post.authorName}</p>
                          <p className="text-[8px] md:text-[9px] font-black uppercase text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : 'Just now'}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm md:text-base leading-relaxed mb-4 md:mb-6 font-medium">{post.content}</p>
                    <div className="flex gap-4 md:gap-6 border-t pt-4 border-zinc-100">
                      <button className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-muted-foreground hover:text-accent"><Heart className="w-3.5 h-3.5" /> {post.likes || 0} Likes</button>
                      <button className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-muted-foreground hover:text-primary"><MessageSquare className="w-3.5 h-3.5" /> Reply</button>
                    </div>
                  </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
              {!reviews || reviews.length === 0 ? (
                <div className="py-12 md:py-20 text-center border-4 border-dashed rounded-[1.5rem] md:rounded-[2.5rem] border-zinc-100 text-zinc-400">
                  <p className="font-black uppercase text-xs md:text-sm">No reviews yet</p>
                </div>
              ) : reviews.map(review => (
                <Card key={review.id} className="p-6 md:p-8 space-y-4 border-none shadow-lg rounded-[1.5rem] md:rounded-[2rem] bg-white dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl overflow-hidden shadow-sm relative bg-zinc-100 dark:bg-zinc-800">
                        <Image src={getRandomAvatar(review.buyerId)} alt="Buyer" fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-black uppercase text-[10px] md:text-xs dark:text-zinc-200">@{review.buyerName || review.buyerId}</p>
                        <p className="text-[8px] md:text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">Verified Collector</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-yellow-500">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className="w-3 md:w-4 h-3 md:h-4 fill-current" />)}</div>
                  </div>
                  <p className="italic font-medium text-base md:text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">"{review.comment}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Badge variant="secondary" className="text-[7px] md:text-[8px] font-black uppercase tracking-widest h-5 px-2 dark:bg-zinc-800 dark:text-zinc-200">{review.listingTitle}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
