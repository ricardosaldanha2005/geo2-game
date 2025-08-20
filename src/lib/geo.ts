// @ts-ignore
import * as turf from '@turf/turf'
import type { Feature, LineString, Polygon } from 'geojson'

type LatLngTuple = [number, number]


export function metersToDegreesLat(meters: number): number {
  return meters / 111320
}

export function metersToDegreesLng(meters: number, atLat: number): number {
  const metersPerDegree = (40075000 * Math.cos((atLat * Math.PI) / 180)) / 360
  return meters / metersPerDegree
}

export function toLineString(points: LatLngTuple[]): Feature<LineString> {
  return turf.lineString(points.map(([lat, lng]) => [lng, lat]))
}

export function closeLoopToPolygon(points: LatLngTuple[]): Feature<Polygon> | null {
  if (points.length < 3) return null
  const ring = points.map(([lat, lng]) => [lng, lat])
  if (ring.length < 3) return null
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push(first)
  }
  try {
    const poly = turf.polygon([ring])
    const cleaned = turf.unkinkPolygon(poly)
    if (cleaned.features.length > 0) {
      return cleaned.features[0] as Feature<Polygon>
    }
    return poly
  } catch {
    return null
  }
}

export function hasSelfIntersection(points: LatLngTuple[]): boolean {
  const numPoints = points.length
  if (numPoints < 4) return false
  const newSegStart = points[numPoints - 2]
  const newSegEnd = points[numPoints - 1]
  const newSeg = turf.lineString([
    [newSegStart[1], newSegStart[0]],
    [newSegEnd[1], newSegEnd[0]],
  ])
  for (let i = 0; i < numPoints - 3; i++) {
    const a = points[i]
    const b = points[i + 1]
    const seg = turf.lineString([
      [a[1], a[0]],
      [b[1], b[0]],
    ])
    const inter = turf.lineIntersect(newSeg, seg)
    if (inter.features.length === 0) continue
    const pt = inter.features[0]
    const onNew = turf.booleanPointOnLine(pt, newSeg, { ignoreEndVertices: true })
    const onOld = turf.booleanPointOnLine(pt, seg, { ignoreEndVertices: true })
    if (onNew && onOld) return true
  }
  return false
}

export function touchesAnyPolygon(
  points: LatLngTuple[],
  polygons: Feature<Polygon, any>[]
): boolean {
  if (points.length < 2 || polygons.length === 0) return false
  const last = points[points.length - 1]
  const lastPoint = turf.point([last[1], last[0]])
  const newSeg = turf.lineString([
    [points[points.length - 2][1], points[points.length - 2][0]],
    [last[1], last[0]],
  ])

  for (const poly of polygons) {
    try {
      if (turf.booleanPointInPolygon(lastPoint, poly as any)) return true
      const outer = poly.geometry.coordinates[0]
      const boundary = turf.lineString(outer)
      const inter = turf.lineIntersect(newSeg, boundary)
      if (inter.features.length > 0) return true
    } catch {
      // ignore invalid polygon
    }
  }
  return false
}

export function touchesAnyPolygonOrNear(
  points: LatLngTuple[],
  polygons: Feature<Polygon, any>[],
  toleranceMeters: number
): boolean {
  if (touchesAnyPolygon(points, polygons)) return true
  if (points.length < 1 || polygons.length === 0) return false
  const last = points[points.length - 1]
  const lastPoint = turf.point([last[1], last[0]])
  for (const poly of polygons) {
    try {
      const outer = poly.geometry.coordinates[0]
      const boundary = turf.lineString(outer)
      const dist = turf.pointToLineDistance(lastPoint as any, boundary as any, { units: 'meters' })
      if (dist <= toleranceMeters) return true
    } catch {}
  }
  return false
}

// Reverted: helpers for no-enclave union/hull removed

export function distanceMeters(a: LatLngTuple, b: LatLngTuple): number {
  const from = turf.point([a[1], a[0]])
  const to = turf.point([b[1], b[0]])
  return turf.distance(from, to, { units: 'meters' })
}

export function sumAreasM2(features: Feature<Polygon, any>[]): number {
  return features.reduce((acc, f) => acc + (f.properties?.areaM2 ?? 0), 0)
}

export function unionAreaM2(features: Feature<Polygon, any>[]): number {
  if (features.length === 0) return 0
  try {
    let u: any = features[0]
    for (let i = 1; i < features.length; i++) {
      try {
        u = turf.union(u as any, features[i] as any) || u
      } catch {
        const buf = turf.buffer(features[i] as any, 0.001, { units: 'kilometers' })
        u = turf.union(u as any, buf as any) || u
      }
    }
    return turf.area(u as any)
  } catch {
    // fallback to simple sum
    return sumAreasM2(features)
  }
}

export function isPointNearAnyPath(
  point: LatLngTuple,
  paths: LatLngTuple[][],
  toleranceMeters: number
): boolean {
  if (paths.length === 0) return false
  const p = turf.point([point[1], point[0]])
  for (const path of paths) {
    if (path.length < 2) continue
    const line = turf.lineString(path.map(([lat, lng]) => [lng, lat]))
    const d = turf.pointToLineDistance(p as any, line as any, { units: 'meters' })
    if (d <= toleranceMeters) return true
  }
  return false
}

export function isPointInsideAnyPolygon(
  point: LatLngTuple,
  polygons: Feature<Polygon, any>[]
): boolean {
  if (polygons.length === 0) return false
  const p = turf.point([point[1], point[0]])
  for (const poly of polygons) {
    try {
      if (turf.booleanPointInPolygon(p as any, poly as any)) return true
    } catch {
      // ignore invalid polygon
    }
  }
  return false
}


