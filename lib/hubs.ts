// Community hubs: people and places offering services across the tracks.
// Coordinates are fictional pilot data in the Maplewood area.

export type HubService =
  | "food"
  | "meals"
  | "tools"
  | "pickup"
  | "driver"
  | "yard"
  | "repair"
  | "rides"
  | "garden"
  | "childcare"
  | "aid";

export const SERVICE_LABELS: Record<HubService, string> = {
  food: "Food",
  meals: "Cooked meals",
  tools: "Tool shed",
  pickup: "Pickup point",
  driver: "Delivery driver",
  yard: "Yard work",
  repair: "Repairs",
  rides: "Rides",
  garden: "Garden swap",
  childcare: "Childcare co-op",
  aid: "Aid navigation",
};

export interface HubHours {
  label: string;
  always?: boolean;
  oncall?: boolean;
  days?: number[]; // 0 = Sunday
  open?: number; // 24h
  close?: number;
}

export interface Hub {
  id: string;
  name: string;
  services: HubService[];
  blurb: string;
  lat: number;
  lng: number;
  hours: HubHours;
}

export const HUBS: Hub[] = [
  { id: "toolshed", name: "Maple Tool Shed", services: ["tools", "repair"], blurb: "45 tools to borrow. Felix sharpens blades on request.", lat: 30.2675, lng: -97.7465, hours: { label: "Sat–Sun 9–5", days: [0, 6], open: 9, close: 17 } },
  { id: "nightowl", name: "Night Owl Pantry", services: ["food"], blurb: "Stocked micro-pantry. Take what you need, leave what you can.", lat: 30.2665, lng: -97.744, hours: { label: "Open 24/7", always: true } },
  { id: "fridge2", name: "Community Fridge #2", services: ["food"], blurb: "Fresh surplus from restaurants and gardens, restocked daily.", lat: 30.269, lng: -97.749, hours: { label: "Open 24/7", always: true } },
  { id: "rosa", name: "Rosa's Kitchen", services: ["meals"], blurb: "Cooks 40 extra plates Tue/Thu. Free for anyone short this week.", lat: 30.2695, lng: -97.743, hours: { label: "Tue, Thu 4–7pm", days: [2, 4], open: 16, close: 19 } },
  { id: "porch", name: "Priya's Porch", services: ["pickup", "driver"], blurb: "Order pickup point plus dispatch porch for the west side.", lat: 30.2683, lng: -97.747, hours: { label: "Daily 8–8", days: [0, 1, 2, 3, 4, 5, 6], open: 8, close: 20 } },
  { id: "marcus", name: "Marcus (driver)", services: ["driver", "rides"], blurb: "Delivers meals east side; gives grocery rides on weekends.", lat: 30.2661, lng: -97.7442, hours: { label: "On-call", oncall: true } },
  { id: "yardcrew", name: "Yard Crew HQ", services: ["yard"], blurb: "Saturday crew: mowing, branches, gutters. Stipend-paid.", lat: 30.2701, lng: -97.748, hours: { label: "Sat 8–12", days: [6], open: 8, close: 12 } },
  { id: "felix", name: "Fix-It Felix", services: ["repair"], blurb: "Small appliance and bike repair, Wednesday evenings.", lat: 30.2655, lng: -97.746, hours: { label: "Wed 5–9pm", days: [3], open: 17, close: 21 } },
  { id: "rides", name: "Ride Circle", services: ["rides"], blurb: "Volunteer rides to clinics, groceries, and aid offices.", lat: 30.267, lng: -97.7425, hours: { label: "On-call", oncall: true } },
  { id: "swap", name: "Garden Swap", services: ["garden"], blurb: "Sunday surplus table: trade zucchini for tomatoes.", lat: 30.2658, lng: -97.743, hours: { label: "Sun 10–1", days: [0], open: 10, close: 13 } },
  { id: "sitters", name: "Sitter Circle", services: ["childcare"], blurb: "Parent co-op: trade sitting hours, no money changes hands.", lat: 30.2705, lng: -97.7455, hours: { label: "Fri evenings", days: [5], open: 17, close: 22 } },
  { id: "aiddesk", name: "Aid Desk", services: ["aid"], blurb: "Help with utility aid forms and appointment booking.", lat: 30.2668, lng: -97.7475, hours: { label: "Mon, Wed 10–2", days: [1, 3], open: 10, close: 14 } },
];

export function isOpenNow(hub: Hub, now: Date = new Date()): boolean {
  if (hub.hours.always || hub.hours.oncall) return true;
  const { days, open, close } = hub.hours;
  if (!days || open === undefined || close === undefined) return false;
  return days.includes(now.getDay()) && now.getHours() >= open && now.getHours() < close;
}

// 24/7 need board: neighbors post needs any time, volunteers claim them.
// In-memory like the order store — fine for the demo.
export interface Need {
  id: string;
  title: string;
  detail: string;
  name: string;
  urgent: boolean;
  claimedBy: string | null;
  createdAt: string;
}

const needs: Need[] = [];
let needSeq = 1;

export function postNeed(input: {
  title: string;
  detail: string;
  name: string;
  urgent: boolean;
}): Need {
  const need: Need = {
    id: `need-${needSeq++}`,
    title: input.title,
    detail: input.detail,
    name: input.name,
    urgent: input.urgent,
    claimedBy: null,
    createdAt: new Date().toISOString(),
  };
  needs.push(need);
  return need;
}

export function listNeeds(): Need[] {
  return [...needs].reverse();
}

export function claimNeed(id: string, volunteer: string): Need | null {
  const need = needs.find((n) => n.id === id);
  if (!need || need.claimedBy) return null;
  need.claimedBy = volunteer;
  return need;
}

// Seed so the board is alive on first load.
postNeed({
  title: "Ride to clinic Tuesday",
  detail: "Morning appointment at the community clinic, wheelchair folds flat.",
  name: "Mrs. Okafor",
  urgent: false,
});
postNeed({
  title: "Fridge #2 running low",
  detail: "Only condiments left — can anyone drop bread or fruit tonight?",
  name: "Night Owl Pantry",
  urgent: true,
});
