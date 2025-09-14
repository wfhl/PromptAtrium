import AspectRatioCalculator from "@/components/AspectRatioCalculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function AspectRatioCalculatorPage() {
  const { user } = useAuth();

  // Apply dark theme for unauthenticated users
  useEffect(() => {
    if (!user) {
      document.documentElement.classList.add('dark');
    }
    // Cleanup function to respect user's actual theme preference when they log in
    return () => {
      if (!user) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme !== 'dark') {
          document.documentElement.classList.remove('dark');
        }
      }
    };
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Aspect Ratio Calculator</CardTitle>
          <CardDescription>
            Calculate and convert between different aspect ratios for your images and designs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AspectRatioCalculator />
        </CardContent>
      </Card>
    </div>
  );
}