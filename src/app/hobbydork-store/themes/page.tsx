import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ThemesPage() {
  // Example theme previews
  // Use app's current theme for all theme previews
  const themes = [
    {
      id: 'default',
      name: 'HobbyDork Default',
      description: 'The official HobbyDork look: modern, clean, and collector-friendly.',
      price: 0,
      preview: (
        <div className="p-4 rounded-lg bg-card border-2 border-primary text-primary-foreground font-bold shadow-lg flex items-center justify-center">
          <span className="text-xl">HobbyDork Default Theme</span>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-primary">Store Themes</h1>
        {themes.map(theme => (
          <Card key={theme.id} className="mb-6 border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary font-bold">{theme.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">{theme.preview}</div>
              <p className="mb-4 text-muted-foreground text-base">{theme.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">{theme.price === 0 ? 'Free' : `$${theme.price}`}</span>
                <Button variant="default">Use Theme</Button>
              </div>
            </CardContent>
          return (
            <AppLayout>
              <div className="max-w-xl mx-auto p-6 space-y-8">
                <h1 className="text-3xl font-bold mb-6 text-primary">Store Themes</h1>
                <Card className="border-2 border-dashed border-primary bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary">Coming Soon!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg text-muted-foreground py-6 text-center">
                      Store themes are under construction.<br />
                      Check back soon for new features.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AppLayout>
          );
