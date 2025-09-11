import AspectRatioCalculator from "@/components/AspectRatioCalculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AspectRatioCalculatorPage() {
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