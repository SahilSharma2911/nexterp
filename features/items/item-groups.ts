// Standard item groups for an EV dealership's stock. Two of these — Spare Part
// and Accessory — also surface as their own modules under Dealership.
export const SPARE_PART_GROUP = "Spare Part";
export const ACCESSORY_GROUP = "Accessory";

export const COMMON_ITEM_GROUPS = [
  SPARE_PART_GROUP,
  ACCESSORY_GROUP,
  "Consumable",
  "Battery",
  "Tyre",
  "Fluid / Lubricant",
  "Tool / Equipment",
  "Merchandise",
  "Raw Material",
  "Other",
] as const;
