import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlaceholderContent({ title, description, children }: { title: string, description: string, children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full">
            <Construction className="h-10 w-10 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl mb-2">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

    