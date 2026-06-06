export const curriculumTracks = [
  "webflow",
  "wordpress",
  "shopify",
  "ui-ux",
  "testing",
  "squarespace",
  "wix"
] as const;

export type CurriculumTrack = (typeof curriculumTracks)[number];

export const DEFAULT_CURRICULUM_TRACK: CurriculumTrack = "shopify";

export const curriculumTrackLabels: Record<CurriculumTrack, string> = {
  webflow: "Webflow",
  wordpress: "WordPress",
  shopify: "Shopify",
  "ui-ux": "UI/UX",
  testing: "Testing",
  squarespace: "Squarespace",
  wix: "Wix"
};

export const isCurriculumTrack = (value: string): value is CurriculumTrack =>
  curriculumTracks.includes(value as CurriculumTrack);
