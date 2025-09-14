import React, { useState } from "react";
import { cn } from "../../utils/cn";
import { Card, CardContent } from "./Card";
import { Badge } from "./Badge";
import { Dialog, DialogContent } from "./Dialog";
import { X } from "lucide-react";

interface CardData {
  id: number;
  title: string;
  description: string;
  categories?: string[] | null;
  tags?: string[] | null;
  era?: string | null;
  colorClass?: string;
  heartIcon?: React.ReactElement;
  expandedContent: () => React.ReactElement;
}

interface MiniCardExpandableCardsProps {
  cards: CardData[];
  columns?: number;
}

export function MiniCardExpandableCards({ 
  cards, 
  columns = 4 
}: MiniCardExpandableCardsProps) {
  const [expandedCard, setExpandedCard] = useState<CardData | null>(null);

  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6",
  };

  return (
    <>
      <div className={cn("grid gap-4", gridCols[columns as keyof typeof gridCols] || gridCols[4])}>
        {cards.map((card) => (
          <Card
            key={card.id}
            className={cn(
              "cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
              card.colorClass
            )}
            onClick={() => setExpandedCard(card)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                  {card.title}
                </h3>
                {card.heartIcon && (
                  <div 
                    className="ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {card.heartIcon}
                  </div>
                )}
              </div>
              
              {card.era && (
                <Badge variant="secondary" className="mb-2 text-xs">
                  {card.era}
                </Badge>
              )}
              
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">
                {card.description}
              </p>
              
              {card.categories && card.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {card.categories.slice(0, 2).map((cat, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="text-xs px-1 py-0"
                    >
                      {cat}
                    </Badge>
                  ))}
                  {card.categories.length > 2 && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-1 py-0"
                    >
                      +{card.categories.length - 2}
                    </Badge>
                  )}
                </div>
              )}
              
              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {card.tags.slice(0, 3).map((tag, i) => (
                    <span 
                      key={i}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      #{tag}
                    </span>
                  ))}
                  {card.tags.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{card.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expanded Card Dialog */}
      {expandedCard && (
        <Dialog 
          open={!!expandedCard} 
          onOpenChange={(open) => !open && setExpandedCard(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{expandedCard.title}</h2>
                  {expandedCard.era && (
                    <Badge variant="secondary" className="mt-2">
                      {expandedCard.era}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => setExpandedCard(null)}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {expandedCard.expandedContent()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}