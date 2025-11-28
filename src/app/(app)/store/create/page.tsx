'use client';
import { useAuth } from "@/hooks/use-auth";
import PlaceholderContent from "@/components/PlaceholderContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

export default function CreateStorePage() {
    const { profile } = useAuth();

    if (profile?.status === 'LIMITED') {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Alert variant="destructive" className="max-w-lg">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Limited Access</AlertTitle>
                      <AlertDescription>
                        Your account has limited access. You cannot create a new store. Please verify your account to get full access.
                      </AlertDescription>
                    </Alert>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <PlaceholderContent 
                title="Create Your Store"
                description="The storefront creation wizard is being polished! Soon you'll be able to set up your own corner of the VaultVerse."
            />
        </AppLayout>
    );
}
