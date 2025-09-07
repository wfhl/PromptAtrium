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
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm font-medium text-muted-foreground" data-testid={`text-${testId}-title`}>
              {title}
            </p>
            <p className="text-xl md:text-2xl font-bold text-foreground" data-testid={`text-${testId}-value`}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-md flex items-center justify-center ${iconColor}`}>
            <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
