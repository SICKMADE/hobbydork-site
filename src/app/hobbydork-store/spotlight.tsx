import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SpotlightPage() {
  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-2">Buy Store Spotlight Slot</h1>
        <Card>
          <CardHeader>
            <CardTitle>Spotlight Slot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Feature your store on the homepage for increased visibility and sales.</p>
            <Button>Purchase for $25</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
