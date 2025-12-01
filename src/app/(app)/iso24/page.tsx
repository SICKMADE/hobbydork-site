'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

type ISO24Post = {
  id: string;
  userUid: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;      // 'ACTIVE' | 'EXPIRED' | etc
  createdAt?: any;      // Firestore Timestamp
  expiresAt?: any;      // Firestore Timestamp
};

type ISO24Comment = {
  id: string;
  authorUid: string;
  authorName?: string;
  text: string;
  createdAt?: any;      // Firestore Timestamp
};

export default function ISO24Page() {
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const canPost =
    !!user &&
    !!profile &&
    profile.status === 'ACTIVE';

  // ---------- QUERY: ISO24 POSTS (simple, index-friendly) ----------
  const isoQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'iso24Posts'),
      orderBy('createdAt', 'desc'),
      limit(200),
    );
  }, [firestore]);

  const {
    data: isoPosts,
    isLoading: postsLoading,
  } = useCollection<ISO24Post>(isoQuery);

  // Filter ACTIVE & not expired on the client
  const activePosts = useMemo(() => {
    if (!isoPosts) return [];
    const nowMs = Date.now();

    return isoPosts.filter((post) => {
      const status = post.status || 'ACTIVE';
      const expiresMs =
        post.expiresAt && post.expiresAt.toDate
          ? post.expiresAt.toDate().getTime()
          : Number.MAX_SAFE_INTEGER;

      return status === 'ACTIVE' && expiresMs > nowMs;
    });
  }, [isoPosts]);

  // Category options derived from posts
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    activePosts.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [activePosts]);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredPosts = useMemo(() => {
    if (categoryFilter === 'ALL') return activePosts;
    return activePosts.filter(
      (p) =>
        (p.category || '').toLowerCase() === categoryFilter.toLowerCase(),
    );
  }, [activePosts, categoryFilter]);

  // ---------- SELECTED POST + COMMENTS ----------
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const selectedPost = useMemo(
    () => filteredPosts.find((p) => p.id === selectedPostId) || null,
    [filteredPosts, selectedPostId],
  );

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedPost) return null;
    return query(
      collection(firestore, 'iso24Posts', selectedPost.id, 'comments'),
      orderBy('createdAt', 'asc'),
    );
  }, [firestore, selectedPost?.id]);

  const {
    data: comments,
    isLoading: commentsLoading,
  } = useCollection<ISO24Comment>(commentsQuery);

  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !profile || !selectedPost) return;
    if (!newComment.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    setCommentError(null);
    setCommentSubmitting(true);

    try {
      await addDoc(
        collection(firestore, 'iso24Posts', selectedPost.id, 'comments'),
        {
          authorUid: user.uid,
          authorName: profile.displayName || '',
          text: newComment.trim(),
          createdAt: serverTimestamp(),
        },
      );
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
      setCommentError('Failed to add comment. Try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleContactPoster = (targetUid: string) => {
    if (!user) {
      // If your app has a dedicated login route, change this
      router.push('/');
      return;
    }
    router.push(`/chat?to=${encodeURIComponent(targetUid)}&source=iso24`);
  };

  // ---------- CREATE ISO POST ----------
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !profile) return;

    if (!title.trim()) {
      setPostError('Title is required.');
      return;
    }

    setPostError(null);
    setPostSubmitting(true);

    try {
      await addDoc(collection(firestore, 'iso24Posts'), {
        userUid: user.uid,
        title: title.trim(),
        description: description.trim() || '',
        category: category.trim() || '',
        status: 'ACTIVE',
        createdAt: serverTimestamp(),
        // expiresAt set by Cloud Function or separate logic (24h)
      });

      setTitle('');
      setCategory('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create ISO24 post', err);
      setPostError('Failed to create ISO24 post. Try again.');
    } finally {
      setPostSubmitting(false);
    }
  };

  // ---------- RENDER ----------
  return (
    <AppLayout>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: List + category filter */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">ISO24</h1>
            <p className="text-sm text-muted-foreground">
              Posts of what users are currently looking to buy. Posts auto-expire
              after 24 hours.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              size="sm"
              variant={categoryFilter === 'ALL' ? 'default' : 'outline'}
              onClick={() => setCategoryFilter('ALL')}
            >
              All
            </Button>
            {categoryOptions.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? 'default' : 'outline'}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {postsLoading && <p>Loading ISO posts...</p>}

          {!postsLoading && filteredPosts.length === 0 && (
            <p className="text-muted-foreground mt-4">
              No active ISO posts for this filter.
            </p>
          )}

          {!postsLoading &&
            filteredPosts.length > 0 &&
            filteredPosts.map((post) => (
              <Card
                key={post.id}
                className={`cursor-pointer ${
                  selectedPostId === post.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedPostId(post.id)}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{post.title}</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      {post.category && (
                        <Badge variant="outline">{post.category}</Badge>
                      )}
                      {post.createdAt && post.createdAt.toDate && (
                        <span className="text-xs text-muted-foreground">
                          Posted{' '}
                          {formatDistanceToNow(post.createdAt.toDate(), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPostId(post.id);
                      }}
                    >
                      View details
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactPoster(post.userUid);
                      }}
                    >
                      Contact poster
                    </Button>
                  </div>
                </CardHeader>
                {post.description && (
                  <CardContent>
                    <p className="text-sm text-foreground/80 line-clamp-2">
                      {post.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
        </div>

        {/* RIGHT: Selected post details + comments + create form */}
        <div className="space-y-6">
          {/* Selected post details + comments */}
          <Card>
            <CardHeader>
              <CardTitle>Post details</CardTitle>
              <CardDescription>
                View full info, comment, or message the poster.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedPost && (
                <p className="text-sm text-muted-foreground">
                  Select a post from the list to see its details.
                </p>
              )}

              {selectedPost && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selectedPost.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {selectedPost.category && (
                        <Badge variant="outline">
                          {selectedPost.category}
                        </Badge>
                      )}
                      {selectedPost.createdAt &&
                        selectedPost.createdAt.toDate && (
                          <span className="text-xs text-muted-foreground">
                            Posted{' '}
                            {formatDistanceToNow(
                              selectedPost.createdAt.toDate(),
                              { addSuffix: true },
                            )}
                          </span>
                        )}
                      {selectedPost.expiresAt &&
                        selectedPost.expiresAt.toDate && (
                          <span className="text-xs text-muted-foreground">
                            · Expires{' '}
                            {selectedPost.expiresAt
                              .toDate()
                              .toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </span>
                        )}
                    </div>
                  </div>

                  {selectedPost.description && (
                    <p className="text-sm text-foreground/80 whitespace-pre-line">
                      {selectedPost.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleContactPoster(selectedPost.userUid)
                      }
                    >
                      Message poster
                    </Button>
                  </div>

                  <Separator className="my-2" />

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Comments</h3>
                    {commentsLoading && (
                      <p className="text-xs text-muted-foreground">
                        Loading comments...
                      </p>
                    )}
                    {!commentsLoading &&
                      (!comments || comments.length === 0) && (
                        <p className="text-xs text-muted-foreground">
                          No comments yet. Be the first.
                        </p>
                      )}
                    {!commentsLoading &&
                      comments &&
                      comments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {comments.map((c) => (
                            <div
                              key={c.id}
                              className="rounded-md border px-2 py-1.5"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold">
                                  {c.authorName || 'User'}
                                </span>
                                {c.createdAt && c.createdAt.toDate && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatDistanceToNow(
                                      c.createdAt.toDate(),
                                      { addSuffix: true },
                                    )}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-1">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                    <form
                      onSubmit={handleCommentSubmit}
                      className="space-y-2 mt-2"
                    >
                      {!canPost && (
                        <p className="text-xs text-red-500 mb-1">
                          Your account must be ACTIVE to comment.
                        </p>
                      )}
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                        disabled={!canPost || commentSubmitting || !selectedPost}
                      />
                      {commentError && (
                        <p className="text-xs text-red-500">
                          {commentError}
                        </p>
                      )}
                      <Button
                        type="submit"
                        size="sm"
                        disabled={
                          !canPost || commentSubmitting || !selectedPost
                        }
                      >
                        {commentSubmitting ? 'Posting...' : 'Post comment'}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create ISO post */}
          <Card>
            <CardHeader>
              <CardTitle>Create ISO Post</CardTitle>
              <CardDescription>
                List what you&apos;re searching for. Posts stay up for 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canPost && (
                <div className="mb-3 text-xs text-red-500">
                  Your account is not ACTIVE yet. Verify email / complete
                  onboarding before posting. You can still browse ISO posts.
                </div>
              )}
              <form onSubmit={handleCreatePost} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What are you looking for?"
                    disabled={!canPost || postSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Comics, Sports Cards, Toys"
                    disabled={!canPost || postSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Details</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Any specific issues, years, players, conditions, etc."
                    rows={3}
                    disabled={!canPost || postSubmitting}
                  />
                </div>
                {postError && (
                  <p className="text-xs text-red-500">{postError}</p>
                )}
                <Separator className="my-2" />
                <Button
                  type="submit"
                  disabled={!canPost || postSubmitting}
                >
                  {postSubmitting ? 'Posting...' : 'Post ISO (24h)'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
