// Standard item groups for an EV dealership's stock. Two of these — Spare Part
// and Accessory — also surface as their own modules under Dealership.
export const SPARE_PART_GROUP = "Spare Part";
export const ACCESSORY_GROUP = "Accessory";

// Minimal set — tyres, batteries, motors etc. are all Spare Parts; fluids are
// Consumables. Keep it to a handful so items land in an obvious bucket.
export const COMMON_ITEM_GROUPS = [
  SPARE_PART_GROUP, // incl. battery, tyre, motor & other replaceable parts
  ACCESSORY_GROUP, // add-ons: helmet, mats, charger, covers…
  "Consumable", // used up in service: fluids, lubricants, cleaners
  "Other",
] as const;
