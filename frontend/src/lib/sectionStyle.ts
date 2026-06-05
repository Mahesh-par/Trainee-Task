import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Flame,
  Info,
  Lightbulb,
  MapPin,
  ShoppingBag,
  Star,
  Target,
  Zap,
  type LucideIcon
} from "lucide-react";

import type { CourseSection, CourseSectionColor, CourseSectionIcon } from "../types";

export const sectionIconOptions: Array<{ value: CourseSectionIcon; label: string }> = [
  { value: "none", label: "No icon" },
  { value: "lightbulb", label: "Lightbulb" },
  { value: "target", label: "Target / Archery" },
  { value: "map-pin", label: "Map pin" },
  { value: "shopping-bag", label: "Shopping bag" },
  { value: "book-open", label: "Book" },
  { value: "check-circle", label: "Check circle" },
  { value: "info", label: "Info" },
  { value: "zap", label: "Zap" },
  { value: "clipboard", label: "Clipboard" },
  { value: "star", label: "Star" },
  { value: "flame", label: "Flame" }
];

export const sectionColorOptions: Array<{ value: CourseSectionColor; label: string }> = [
  { value: "default", label: "Default (white)" },
  { value: "amber", label: "Warm amber" },
  { value: "orange", label: "Warm orange" },
  { value: "rose", label: "Warm rose" },
  { value: "red", label: "Warm red" },
  { value: "emerald", label: "Emerald green" }
];

const variantStyleMap = {
  default: { icon: "none", color: "default" },
  task: { icon: "target", color: "emerald" },
  tips: { icon: "lightbulb", color: "amber" },
  shopify: { icon: "shopping-bag", color: "default" },
  location: { icon: "map-pin", color: "rose" }
} as const;

export const resolveSectionStyle = (section: CourseSection) => {
  const icon = section.icon ?? (section.variant ? variantStyleMap[section.variant].icon : "none");
  const color = section.color ?? (section.variant ? variantStyleMap[section.variant].color : "default");

  return {
    icon: icon as CourseSectionIcon,
    color: color as CourseSectionColor
  };
};

export const sectionColorStyles: Record<
  CourseSectionColor,
  { border: string; bg: string; heading: string; text: string; highlight: boolean }
> = {
  default: {
    border: "border-gray-200",
    bg: "bg-white",
    heading: "text-navy-800",
    text: "text-gray-700",
    highlight: false
  },
  amber: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    heading: "text-amber-900",
    text: "text-amber-950",
    highlight: true
  },
  orange: {
    border: "border-orange-200",
    bg: "bg-orange-50",
    heading: "text-orange-900",
    text: "text-orange-950",
    highlight: true
  },
  rose: {
    border: "border-rose-200",
    bg: "bg-rose-50",
    heading: "text-rose-900",
    text: "text-rose-950",
    highlight: true
  },
  red: {
    border: "border-red-200",
    bg: "bg-red-50",
    heading: "text-red-900",
    text: "text-red-950",
    highlight: true
  },
  emerald: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    heading: "text-emerald-900",
    text: "text-emerald-950",
    highlight: true
  }
};

export const sectionIconComponents: Partial<Record<CourseSectionIcon, LucideIcon>> = {
  lightbulb: Lightbulb,
  target: Target,
  "map-pin": MapPin,
  "shopping-bag": ShoppingBag,
  "book-open": BookOpen,
  "check-circle": CheckCircle2,
  info: Info,
  zap: Zap,
  clipboard: ClipboardList,
  star: Star,
  flame: Flame
};
