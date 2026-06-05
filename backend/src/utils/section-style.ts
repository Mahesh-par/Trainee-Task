export const courseSectionIcons = [
  "none",
  "lightbulb",
  "target",
  "map-pin",
  "shopping-bag",
  "book-open",
  "check-circle",
  "info",
  "zap",
  "clipboard",
  "star",
  "flame"
] as const;

export const courseSectionColors = ["default", "amber", "orange", "rose", "red", "emerald"] as const;

export type CourseSectionIcon = (typeof courseSectionIcons)[number];
export type CourseSectionColor = (typeof courseSectionColors)[number];

type LegacySectionVariant = "default" | "task" | "tips" | "shopify" | "location";

const variantStyleMap: Record<
  LegacySectionVariant,
  { icon: CourseSectionIcon; color: CourseSectionColor }
> = {
  default: { icon: "none", color: "default" },
  task: { icon: "target", color: "emerald" },
  tips: { icon: "lightbulb", color: "amber" },
  shopify: { icon: "shopping-bag", color: "default" },
  location: { icon: "map-pin", color: "rose" }
};

export const resolveSectionStyle = (section: {
  icon?: string;
  color?: string;
  variant?: LegacySectionVariant;
}) => {
  const icon = courseSectionIcons.includes(section.icon as CourseSectionIcon)
    ? (section.icon as CourseSectionIcon)
    : section.variant
      ? variantStyleMap[section.variant].icon
      : "none";

  const color = courseSectionColors.includes(section.color as CourseSectionColor)
    ? (section.color as CourseSectionColor)
    : section.variant
      ? variantStyleMap[section.variant].color
      : "default";

  return { icon, color };
};
