const geocodeCache = new Map<string, [number, number] | null>();

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const key = address.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  try {
    const q = encodeURIComponent(address + ", Argentina");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "User-Agent": "OXI-GAS Hoja de Ruta" } }
    );
    if (!res.ok) { geocodeCache.set(key, null); return null; }
    const data = await res.json();
    if (data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache.set(key, coords);
      return coords;
    }
  } catch {}
  geocodeCache.set(key, null);
  return null;
}

function dist(a: [number, number], b: [number, number]) {
  const d0 = a[0] - b[0], d1 = a[1] - b[1];
  return Math.sqrt(d0 * d0 + d1 * d1);
}

export async function optimizeRoute<T extends { dir?: string | null }>(
  items: T[],
  onProgress?: (done: number, total: number) => void
): Promise<T[]> {
  const withAddr = items.filter((it) => it.dir?.trim());
  const noAddr = items.filter((it) => !it.dir?.trim());

  type GeoItem = { item: T; coords: [number, number] };
  const geoItems: GeoItem[] = [];
  const failedItems: T[] = [];

  for (let i = 0; i < withAddr.length; i++) {
    const item = withAddr[i];
    const alreadyCached = geocodeCache.has((item.dir || "").trim().toLowerCase());
    const coords = await geocodeAddress(item.dir!);
    if (coords) {
      geoItems.push({ item, coords });
    } else {
      failedItems.push(item);
    }
    onProgress?.(i + 1, withAddr.length);
    if (!alreadyCached && i < withAddr.length - 1) await sleep(1100);
  }

  if (geoItems.length < 2) return [...items];

  const unvisited = [...geoItems];
  const ordered: GeoItem[] = [unvisited.shift()!];

  while (unvisited.length > 0) {
    const last = ordered[ordered.length - 1];
    let minD = Infinity, minIdx = 0;
    for (let j = 0; j < unvisited.length; j++) {
      const d = dist(last.coords, unvisited[j].coords);
      if (d < minD) { minD = d; minIdx = j; }
    }
    ordered.push(unvisited.splice(minIdx, 1)[0]);
  }

  return [...ordered.map((g) => g.item), ...failedItems, ...noAddr];
}
