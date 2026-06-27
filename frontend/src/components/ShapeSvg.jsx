import { useRef } from 'react'
import * as d3 from 'd3'
import { useTheme } from '../contexts/ThemeContext.jsx'

let _instanceCounter = 0

export default function ShapeSvg({ geojsonStr, height = 160 }) {
  const { theme } = useTheme()
  const rotationRef = useRef((Math.random() * 30 - 15).toFixed(1))
  const filterId = useRef(`shapeShadow-${++_instanceCounter}`).current
  const shapeFill = theme === 'dark' ? '#4F70FF' : '#1B3FE4'

  if (!geojsonStr) return <div className="text-muted text-sm">No shape data</div>

  let geojson
  try { geojson = JSON.parse(geojsonStr) } catch { return <div className="text-muted text-sm">Invalid shape</div> }

  const W = 280, H = 220, PAD = 16
  const feature = { type: 'Feature', geometry: geojson, properties: {} }

  let pathData
  try {
    const centroid = d3.geoCentroid(feature)
    const projection = d3.geoAzimuthalEqualArea()
      .rotate([-centroid[0], -centroid[1]])
      .fitExtent([[PAD, PAD], [W - PAD, H - PAD]], feature)
    const pathGen = d3.geoPath().projection(projection)
    pathData = pathGen(feature)
    if (!pathData || pathData.length < 10) return <div className="text-muted text-sm">Shape unavailable</div>
  } catch {
    return <div className="text-muted text-sm">Shape unavailable</div>
  }

  return (
    <div className="w-full flex items-center justify-center" style={{ height, overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%', transform: `rotate(${rotationRef.current}deg)`, transformOrigin: 'center' }}
      >
        <defs>
          <filter id={filterId}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
        <path d={pathData} fill={shapeFill} stroke="white" strokeWidth={1} filter={`url(#${filterId})`} />
      </svg>
    </div>
  )
}
