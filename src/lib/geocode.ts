import { safeFetch } from "./fetch.js";
import { getOrFetch, TTL } from "./cache.js";

export interface GeoResult {
  lat: number;
  lon: number;
  normalized: string;
  prefecture?: string;
  municipality?: string;
}

const PREF = /^(北海道|東京都|京都府|大阪府|.{2,3}?県)/;

/**
 * Pure parse of a normalized Japanese address into prefecture + municipality.
 * Exported so it can be tested without a network call. The first capture is the
 * 都道府県; the remainder is matched up to the first 市/区/町/村 boundary.
 */
export function parsePrefMuni(normalized: string): { prefecture?: string; municipality?: string } {
  const pm = normalized.match(PREF);
  if (!pm) return {};
  const prefecture = pm[1];
  const rest = normalized.slice(prefecture.length);
  const municipality = rest.match(/^(.+?[市区町村])/)?.[1];
  return { prefecture, municipality };
}

/** Address → coordinates via the GSI (Geospatial Information Authority of Japan) geocoder. */
export async function geocode(address: string): Promise<GeoResult> {
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
  const data = (await getOrFetch(`geo:${address}`, TTL.GEOCODE, () =>
    safeFetch(url).then((r) => r.json())
  )) as Array<{ geometry?: { coordinates?: [number, number] }; properties?: { title?: string } }>;

  if (!Array.isArray(data) || data.length === 0 || !data[0]?.geometry?.coordinates) {
    throw new Error(`No location found for "${address}". Try a more complete Japanese address.`);
  }
  const top = data[0];
  const [lon, lat] = top.geometry!.coordinates!;
  const normalized = top.properties?.title ?? address;
  return { lat, lon, normalized, ...parsePrefMuni(normalized) };
}
