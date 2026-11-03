// Portland taxlot parcels via Metro RLIS (public, no key).
// Official open data: county assessors + City of Portland, no ownership info.
// License: RLIS Open Database EULA. Verified live Nov 2026.

export interface Lot {
  id: string;
  address: string;
  areaSqft: number;
  acres: number;
  landuse: string;
  /** Polygon exterior rings as [lng, lat] pairs. */
  rings: Array<Array<[number, number]>>;
}

const RLIS =
  "https://services2.arcgis.com/McQ0OlIABe29rJJy/arcgis/rest/services/Taxlots_(Public)/FeatureServer/3/query";

interface GeoJsonFeature {
  properties?: Record<string, unknown>;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
}

function toRings(geometry: GeoJsonFeature["geometry"]): Array<Array<[number, number]>> {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];
  const isNum = (v: unknown): v is number => typeof v === "number";
  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates as unknown[];
    return (Array.isArray(rings[0]) ? [rings[0]] : []).map((ring) =>
      (ring as unknown[])
        .filter((p): p is [number, number] => Array.isArray(p) && isNum(p[0]) && isNum(p[1]))
        .map(([lng, lat]) => [lng, lat] as [number, number])
    );
  }
  if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates as unknown[];
    return polys.flatMap((poly) => {
      if (!Array.isArray(poly) || !Array.isArray(poly[0])) return [];
      const ring = (poly[0] as unknown[]).filter(
        (p): p is [number, number] => Array.isArray(p) && isNum(p[0]) && isNum(p[1])
      );
      return ring.length > 0 ? [ring.map(([lng, lat]) => [lng, lat] as [number, number])] : [];
    });
  }
  return [];
}

export async function fetchLots(
  w: number,
  s: number,
  e: number,
  n: number,
  landuse = "SFR"
): Promise<Lot[]> {
  const params = new URLSearchParams({
    where: `LANDUSE='${landuse}'`,
    geometry: `${w},${s},${e},${n}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "TLID,SITEADDR,GIS_ACRES,AREA,LANDUSE",
    returnGeometry: "true",
    resultRecordCount: "150",
    f: "geojson",
  });
  const res = await fetch(`${RLIS}?${params.toString()}`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`rlis_${res.status}`);
  const data = (await res.json()) as { features?: GeoJsonFeature[] };
  return ((data.features ?? []) as GeoJsonFeature[])
    .map((f) => {
      const p = f.properties ?? {};
      const str = (v: unknown) => (typeof v === "string" ? v : "");
      const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
      return {
        id: str(p.TLID) || `${num(p.AREA)}`,
        address: str(p.SITEADDR) || "Unknown address",
        areaSqft: Math.round(num(p.AREA)),
        acres: Math.round(num(p.GIS_ACRES) * 1000) / 1000,
        landuse: str(p.LANDUSE) || landuse,
        rings: toRings(f.geometry),
      };
    })
    .filter((lot) => lot.rings.length > 0)
    .slice(0, 150);
}
