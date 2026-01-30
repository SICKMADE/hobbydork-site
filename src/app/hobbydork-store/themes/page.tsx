"use client";
import AppLayout from "@/components/layout/AppLayout";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import ThemeSelector from "@/app/seller/settings/ThemeSelector";
import { storeThemes } from "@/lib/storeThemes";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, updateDoc, arrayUnion } from "firebase/firestore";
import styles from "./themes.module.css";
import dynamic from "next/dynamic";

const DemoStore = dynamic(() => import("./DemoStore"), { ssr: false });

function ThemesPage() {
  const { user, userData } = useAuth();
  const [loadingThemeId, setLoadingThemeId] = useState<string | null>(null);
  const [purchasingThemeId, setPurchasingThemeId] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<any>(null);
  const [activeTheme, setActiveTheme] = useState<string>(() => (userData && typeof userData.activeTheme === 'string' ? userData.activeTheme : ""));
  const [ownedThemes, setOwnedThemes] = useState<string[]>(() => (userData && Array.isArray(userData.ownedThemes) ? userData.ownedThemes : []));
  const [themes] = useState(() => Object.entries(storeThemes));
  const { toast } = useToast();
  const firestore = getFirestore();

  async function handleSwitchTheme(themeId: string) {
    if (!user) return;
    setLoadingThemeId(themeId);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { activeTheme: themeId });
      toast({
        title: "Theme Activated",
        description: `You have switched to the '${themeId}' theme. View your store to see it live!`,
        variant: "default",
        action: (
          <button
            onClick={() => window.location.href = `/store/${userData?.storeId || user?.uid}`}
            className="underline font-bold"
          >
            View Store
          </button>
        )
      });
      setActiveTheme(themeId);
    } catch (e) {
      toast({
        title: "Theme Switch Failed",
        description: "Could not switch theme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingThemeId(null);
    }
  }

  async function handlePurchaseTheme(themeId: string) {
    if (!user) return;
    setPurchasingThemeId(themeId);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { ownedThemes: arrayUnion(themeId) });
      toast({
        title: "Theme Purchased",
        description: `You now own the '${themeId}' theme. Activate it below!`,
        variant: "default",
      });
      setOwnedThemes([...ownedThemes, themeId]);
    } catch (e) {
      toast({
        title: "Theme Purchase Failed",
        description: "Could not purchase theme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasingThemeId(null);
    }
  }

  return (
    <AppLayout sidebarComponent={<SellerSidebar />}> 
      <div className="max-w-xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold mb-2 text-primary">Store Themes</h1>
        <p className="mb-4 text-base text-muted-foreground">
          <b>Themes</b> change the colors, fonts, and overall style of your store. To change the layout/structure, visit the <a href="/hobbydork-store/layouts" className="underline text-primary font-semibold">Store Layouts</a> page.
        </p>
        <div className="mb-6">
          <a href="/hobbydork-store/layouts">
            <Button variant="secondary" className="w-full font-bold">Go to Store Layouts</Button>
          </a>
        </div>

        {!user && (
          <div className="mb-6 text-red-600 font-semibold">Sign in to purchase or switch themes.</div>
        )}
        {user && !userData?.isSeller && (
          <div className="mb-6 text-yellow-700 font-semibold">You must be a seller to purchase or switch store themes. <a href='/become-seller' className='underline'>Become a seller</a></div>
        )}
        {/* Feedback is now handled by toast notifications for a cleaner UI */}
        {themes.map(([themeId, theme]) => (
          <Card key={themeId} className="mb-6 border-primary shadow-lg" tabIndex={0} aria-label={theme.name}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-primary font-bold flex items-center gap-2">
                {theme.name}
              </CardTitle>
              <Button
                variant="outline"
                aria-label={`Preview ${theme.name} theme`}
                onClick={() => setPreviewTheme({ ...theme, id: themeId })}
                className="ml-2"
              >
                Preview
              </Button>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground text-base">
                {theme.details || 'A unique store theme.'}
              </p>
              <div className="flex items-center justify-between">
                {user ? (
                  userData?.isSeller ? (
                    ownedThemes.includes(themeId) ? (
                      <Button
                        variant="default"
                        aria-label={activeTheme === themeId ? `Theme '${theme.name}' is active` : `Switch to theme '${theme.name}'`}
                        disabled={loadingThemeId === themeId}
                        onClick={() => handleSwitchTheme(themeId)}
                      >
                        {loadingThemeId === themeId
                          ? 'Switching...'
                          : activeTheme === themeId
                            ? 'Active (Click to Reset)'
                            : 'Switch to this Theme'}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        aria-label={`Purchase theme '${theme.name}'`}
                        onClick={() => handlePurchaseTheme(themeId)}
                        disabled={purchasingThemeId === themeId}
                      >
                        {purchasingThemeId === themeId ? 'Purchasing...' : 'Purchase Theme'}
                      </Button>
                    )
                  ) : (
                    <Button variant="secondary" aria-label="Seller account required" disabled>
                      Purchase Theme
                    </Button>
                  )
                ) : (
                  <Button variant="secondary" aria-label="Sign in to purchase" disabled>
                    Purchase Theme
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {/* If user owns any themes, show ThemeSelector for switching */}
        {user && userData?.isSeller && ownedThemes.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-2">Switch Your Store Theme</h2>
            <ThemeSelector userId={user?.uid || ""} />
          </div>
        )}
      {/* Live Preview Modal */}
      {previewTheme && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 relative ${styles.previewModal}`}
            data-theme-id={previewTheme.id}
          >
            <button
              className="absolute top-2 right-2 text-lg font-bold text-gray-700 hover:text-black"
              aria-label="Close preview"
              onClick={() => setPreviewTheme(null)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              {previewTheme.name} Theme Preview
            </h2>
            <div className="mb-4">
              <DemoStore themeId={previewTheme.id} />
            </div>
            <Button
              variant="default"
              className="w-full mt-2"
              onClick={() => setPreviewTheme(null)}
              aria-label="Close preview"
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}

export default ThemesPage;
