
'use client';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (profile?.role !== 'ADMIN') {
    return (
        <div className="flex items-center justify-center h-full">
            <Alert variant="destructive" className="max-w-lg">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Permission Denied</AlertTitle>
                <AlertDescription>
                You do not have the required permissions to access this page.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return <>{children}</>;
}
