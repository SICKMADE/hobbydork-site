import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LayoutsPage() {
  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-2">Custom Store Layouts</h1>
        <Card>
          <CardHeader>
            <CardTitle>Layout Options</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Upgrade your store layout for a better buyer experience and more sales.</p>
            <Button>View Layout Options</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Request Custom Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Need something special? Request a custom store layout.</p>
            <Button>Request Custom Layout</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
