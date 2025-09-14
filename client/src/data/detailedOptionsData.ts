export interface DetailedOption {
  value: string;
  label: string;
}

export interface SubCategory {
  name: string;
  label: string;
  options: DetailedOption[];
}

export interface CategoryOption {
  name: string;
  label: string;
  subCategories: SubCategory[];
}

export const DETAILED_OPTIONS_CATEGORIES: CategoryOption[] = [
  {
    name: "architecture",
    label: "Architecture",
    subCategories: [
      {
        name: "styles",
        label: "Architectural Styles",
        options: [
          { value: "modern", label: "Modern" },
          { value: "gothic", label: "Gothic" },
          { value: "art_deco", label: "Art Deco" },
          { value: "brutalist", label: "Brutalist" },
          { value: "classical", label: "Classical" },
        ]
      }
    ]
  },
  {
    name: "art",
    label: "Art Styles",
    subCategories: [
      {
        name: "movements",
        label: "Art Movements",
        options: [
          { value: "impressionism", label: "Impressionism" },
          { value: "surrealism", label: "Surrealism" },
          { value: "cubism", label: "Cubism" },
          { value: "abstract", label: "Abstract" },
          { value: "realism", label: "Realism" },
        ]
      }
    ]
  },
  {
    name: "cinematic",
    label: "Cinematic",
    subCategories: [
      {
        name: "shots",
        label: "Camera Shots",
        options: [
          { value: "establishing_shot", label: "Establishing Shot" },
          { value: "tracking_shot", label: "Tracking Shot" },
          { value: "dolly_zoom", label: "Dolly Zoom" },
          { value: "crane_shot", label: "Crane Shot" },
          { value: "handheld", label: "Handheld" },
        ]
      }
    ]
  },
  {
    name: "fashion",
    label: "Fashion",
    subCategories: [
      {
        name: "styles",
        label: "Fashion Styles",
        options: [
          { value: "haute_couture", label: "Haute Couture" },
          { value: "streetwear", label: "Streetwear" },
          { value: "vintage", label: "Vintage" },
          { value: "minimalist", label: "Minimalist" },
          { value: "avant_garde", label: "Avant-garde" },
        ]
      }
    ]
  },
  {
    name: "feelings",
    label: "Feelings & Emotions",
    subCategories: [
      {
        name: "moods",
        label: "Moods",
        options: [
          { value: "joyful", label: "Joyful" },
          { value: "melancholic", label: "Melancholic" },
          { value: "peaceful", label: "Peaceful" },
          { value: "dramatic", label: "Dramatic" },
          { value: "mysterious", label: "Mysterious" },
        ]
      }
    ]
  }
];