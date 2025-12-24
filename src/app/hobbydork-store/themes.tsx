import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ThemesPage() {
  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-2">Custom Store Themes</h1>
        <Card>
          <CardHeader>
            <CardTitle>Premium Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Choose from a selection of premium themes to personalize your store.</p>
            <Button>Browse Themes</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Request Custom Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Want something unique? Request a custom theme designed just for you.</p>
            <Button>Request Custom Theme</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
