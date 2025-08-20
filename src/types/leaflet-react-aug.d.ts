// Type augmentations for react-leaflet props to accept common shorthand props
// This keeps our code simple without refactoring to full PathOptions or icon typings.
import 'react-leaflet'
import type { PathOptions } from 'leaflet'
import type { CSSProperties } from 'react'

declare module 'react-leaflet' {
	interface PolylineProps {
		color?: string
		pathOptions?: PathOptions
		dashArray?: string
	}
	interface MarkerProps {
		icon?: any
	}
	interface GeoJSONProps {
		style?: PathOptions | ((feature: any) => PathOptions)
		className?: string
	}
	interface TileLayerProps {
		attribution?: string
	}
  interface MapContainerProps {
    center?: any
    zoom?: number
    style?: CSSProperties
  }
}
