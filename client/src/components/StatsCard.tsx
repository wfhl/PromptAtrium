import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  testId: string;
}

export function StatsCard({ title, value, icon: Icon, iconColor, testId }: StatsCardProps) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground" data-testid={`text-${testId}-title`}>
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground" data-testid={`text-${testId}-value`}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
