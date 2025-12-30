import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SpotlightPage() {
  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-2">Store Spotlight</h1>
        <Card className="border-2 border-dashed border-primary bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Coming Soon!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg text-muted-foreground py-6 text-center">
              Store spotlight is under construction.<br />
              Check back soon for new features.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
