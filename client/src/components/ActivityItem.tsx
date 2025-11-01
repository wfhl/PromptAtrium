import { GitBranch, Heart, Plus } from "lucide-react";

interface ActivityItemProps {
  type: "branch" | "like" | "create";
  user: string;
  promptName: string;
  timestamp: string;
  testId: string;
}

export function ActivityItem({ type, user, promptName, timestamp, testId }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case "branch":
        return <GitBranch className="h-3 w-3 text-white" />;
      case "like":
        return <Heart className="h-3 w-3 text-white" />;
      case "create":
        return <Plus className="h-3 w-3 text-white" />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "branch":
        return "bg-blue-500";
      case "like":
        return "bg-red-500";
      case "create":
        return "bg-green-500";
    }
  };

  const getActionText = () => {
    switch (type) {
      case "branch":
        return "branched";
      case "like":
        return "liked";
      case "create":
        return "created";
    }
  };

  return (
    <div className="flex items-start space-x-3" data-testid={testId}>
      <div className={`w-6 h-6 ${getIconColor()} rounded-full flex items-center justify-center flex-shrink-0`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground" data-testid={`text-${testId}-user`}>
            {user}
          </span>{" "}
          {getActionText()}{" "}
          <span className="font-medium" data-testid={`text-${testId}-prompt`}>
            "{promptName}"
          </span>
        </p>
        <p className="text-xs text-muted-foreground" data-testid={`text-${testId}-timestamp`}>
          {timestamp}
        </p>
      </div>
    </div>
  );
}
