// DEMO DATA — Portland pilot seeds (fictional).
// Plausible Portland, OR coordinates around two pilot neighborhoods:
// Pearl District (~45.527, -122.68) and Alberta Arts (~45.559, -122.65).
// Names, hours, and open/closed flags are invented for the demo.

export type PortlandNeighborhood = "Pearl District" | "Alberta Arts";

export interface PortlandRestaurant {
  id: string;
  name: string;
  cuisine: string;
  lat: number;
  lng: number;
  neighborhood: PortlandNeighborhood;
  hoursLabel: string;
  openNow: boolean;
}

export interface PortlandHub {
  id: string;
  name: string;
  services: string[];
  blurb: string;
  lat: number;
  lng: number;
  neighborhood: PortlandNeighborhood;
  hoursLabel: string;
  openNow: boolean;
}

export const PORTLAND_RESTAURANTS: PortlandRestaurant[] = [
  {
    id: "pdx-slash",
    name: "Slash & Pearl",
    cuisine: "Pacific NW",
    lat: 45.5282,
    lng: -122.6801,
    neighborhood: "Pearl District",
    hoursLabel: "Daily 11–10",
    openNow: true,
  },
  {
    id: "pdx-dumpling",
    name: "Jade Dumpling Den",
    cuisine: "Chinese",
    lat: 45.5261,
    lng: -122.6823,
    neighborhood: "Pearl District",
    hoursLabel: "Tue–Sun 12–9",
    openNow: true,
  },
  {
    id: "pdx-torta",
    name: "Torta Verde",
    cuisine: "Mexican",
    lat: 45.529,
    lng: -122.6775,
    neighborhood: "Pearl District",
    hoursLabel: "Mon–Sat 10–8",
    openNow: false,
  },
  {
    id: "pdx-alberta-pie",
    name: "Alberta Pie Co.",
    cuisine: "Italian",
    lat: 45.5592,
    lng: -122.6505,
    neighborhood: "Alberta Arts",
    hoursLabel: "Daily 12–10",
    openNow: true,
  },
  {
    id: "pdx-forage",
    name: "Forage & Fern Cafe",
    cuisine: "Cafe",
    lat: 45.5601,
    lng: -122.6478,
    neighborhood: "Alberta Arts",
    hoursLabel: "Daily 7–3",
    openNow: false,
  },
];

export const PORTLAND_HUBS: PortlandHub[] = [
  {
    id: "pdx-tool",
    name: "Pearl Tool Library",
    services: ["Tool shed", "Repairs"],
    blurb: "Borrow tools and get small fixes from volunteer hosts.",
    lat: 45.5275,
    lng: -122.681,
    neighborhood: "Pearl District",
    hoursLabel: "Sat–Sun 9–5",
    openNow: false,
  },
  {
    id: "pdx-fridge",
    name: "Pearl Community Fridge",
    services: ["Food"],
    blurb: "Surplus from pilot restaurants, restocked daily. Take what you need.",
    lat: 45.5253,
    lng: -122.679,
    neighborhood: "Pearl District",
    hoursLabel: "Open 24/7",
    openNow: true,
  },
  {
    id: "pdx-porch",
    name: "Jamison Porch Pickup",
    services: ["Pickup point"],
    blurb: "Order pickup porch for the Pearl side of the pilot.",
    lat: 45.5288,
    lng: -122.6835,
    neighborhood: "Pearl District",
    hoursLabel: "Daily 8–8",
    openNow: true,
  },
  {
    id: "pdx-swap",
    name: "Alberta Garden Swap",
    services: ["Garden swap"],
    blurb: "Weekend surplus table: trade tomatoes for zucchini.",
    lat: 45.5584,
    lng: -122.652,
    neighborhood: "Alberta Arts",
    hoursLabel: "Sun 10–1",
    openNow: false,
  },
  {
    id: "pdx-rides",
    name: "Alberta Ride Circle",
    services: ["Rides", "Aid navigation"],
    blurb: "Volunteer rides to clinics and groceries, plus aid-form help.",
    lat: 45.5605,
    lng: -122.6492,
    neighborhood: "Alberta Arts",
    hoursLabel: "On-call",
    openNow: true,
  },
];
