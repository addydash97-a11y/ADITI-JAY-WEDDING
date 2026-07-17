import {
  Building2,
  Utensils,
  Camera,
  Video,
  Flower2,
  Flower,
  Gem,
  BedDouble,
  Music4,
  Lightbulb,
  Sparkles,
  Shirt,
  Hand,
  Mail,
  Car,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  'building-2': Building2,
  utensils: Utensils,
  camera: Camera,
  video: Video,
  'flower-2': Flower2,
  flower: Flower,
  gem: Gem,
  'bed-double': BedDouble,
  'music-4': Music4,
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  shirt: Shirt,
  hand: Hand,
  mail: Mail,
  car: Car,
  'more-horizontal': MoreHorizontal,
};

export function BookingCategoryIcon({ iconKey, size = 18, className }: { iconKey: string; size?: number; className?: string }) {
  const Icon = ICON_MAP[iconKey] ?? Sparkles;
  return <Icon size={size} className={className} />;
}
