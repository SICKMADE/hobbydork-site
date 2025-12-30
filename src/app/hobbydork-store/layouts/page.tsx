import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LayoutsPage() {
  // Themed preview components
  const GridLayoutPreview = () => (
    <div className="grid grid-cols-3 gap-2 p-2 bg-gradient-to-br from-cyan-100 to-cyan-400 rounded-lg border-2 border-cyan-500 shadow-lg">
      <div className="h-16 bg-cyan-500 rounded-lg border-2 border-cyan-700" />
      <div className="h-16 bg-cyan-300 rounded-lg border-2 border-cyan-500" />
      <div className="h-16 bg-cyan-200 rounded-lg border-2 border-cyan-400" />
    </div>
  );
  const ShowcaseLayoutPreview = () => (
    <div className="flex gap-2 p-2 bg-gradient-to-br from-fuchsia-100 to-fuchsia-400 rounded-xl border-2 border-fuchsia-500 shadow-lg">
      <div className="h-20 w-2/3 bg-fuchsia-500 rounded-xl border-2 border-fuchsia-700" />
      <div className="h-20 w-1/3 bg-fuchsia-200 rounded-xl border-2 border-fuchsia-400" />
    </div>
  );
  const MinimalLayoutPreview = () => (
    <div className="flex flex-col items-center p-2 bg-gradient-to-br from-amber-100 to-amber-300 rounded-2xl border-2 border-amber-400 shadow-lg">
      <div className="h-14 w-3/4 bg-amber-400 rounded-2xl border-2 border-amber-600" />
      <div className="mt-2 h-4 w-1/2 bg-amber-200 rounded-full border border-amber-300" />
    </div>
  );

  const layoutOptions = [
    {
      id: "grid",
      name: "Grid Layout",
      description: "Classic grid for product display.",
      price: 10,
      preview: <GridLayoutPreview />,
    },
    {
      id: "showcase",
      name: "Showcase Layout",
      description: "Highlight featured products.",
      price: 15,
      preview: <ShowcaseLayoutPreview />,
    },
    {
      id: "minimal",
      name: "Minimal Layout",
      description: "Clean and simple look.",
      price: 8,
      preview: <MinimalLayoutPreview />,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-2">Custom Store Layouts</h1>
        {layoutOptions.map(layout => (
          <Card key={layout.id} className="mb-4">
            <CardHeader>
              <CardTitle>{layout.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">{layout.preview}</div>
              <p className="mb-2 text-muted-foreground">{layout.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">${layout.price}</span>
                <Button>Buy Layout</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}

