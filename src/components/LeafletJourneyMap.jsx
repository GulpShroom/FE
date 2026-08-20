import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { feature } from 'topojson-client'
import worldAtlas from 'world-atlas/countries-110m.json'
import 'leaflet/dist/leaflet.css'
import journeyThumb from '../assets/final/journey-thumb.png'
import { searchableCountries } from '../data/countries'

const countryById = new Map(searchableCountries.map((country) => [country.id, country]))
const countryShapes = feature(worldAtlas, worldAtlas.objects.countries).features
const countryShapeByNumericCode = new Map(
  countryShapes.map((countryShape) => [String(countryShape.id).padStart(3, '0'), countryShape]),
)

function CountryViewport({ countryId }) {
  const map = useMap()

  useEffect(() => {
    if (countryId === 'all') {
      map.fitBounds([[-58, -170], [78, 180]], { padding: [12, 12] })
      return
    }

    const country = countryById.get(countryId)
    const countryShape = countryShapeByNumericCode.get(country?.numericCode)

    if (countryShape) {
      const bounds = L.geoJSON(countryShape).getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [18, 18], maxZoom: 7 })
        return
      }
    }

    if (country?.center) map.setView(country.center, 5)
  }, [countryId, map])

  return null
}

function createPhotoMarker(point) {
  const marker = document.createElement('div')
  marker.className = 'leaflet-journey-marker'

  const image = document.createElement('img')
  image.src = point.photoUrl || point.thumbnailUrl || journeyThumb
  image.alt = ''
  marker.append(image)

  if (point.value != null) {
    const count = document.createElement('span')
    count.textContent = String(point.value)
    marker.append(count)
  }

  return L.divIcon({
    className: 'leaflet-journey-marker-wrap',
    html: marker,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  })
}

export function LeafletJourneyMap({ points = [], countryId = 'all' }) {
  const visiblePoints = useMemo(
    () => points.filter((point) => (
      countryId === 'all' || String(point.country).toLowerCase() === countryId
    )),
    [countryId, points],
  )

  const markers = useMemo(() => visiblePoints.flatMap((point, index) => {
    const pointCountryId = String(point.country).toLowerCase()
    const fallbackCenter = countryById.get(pointCountryId)?.center
    const position = Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
      ? [point.latitude, point.longitude]
      : fallbackCenter

    if (!position) return []

    return [{
      key: point.journeyId || `${pointCountryId}-${index}`,
      position,
      icon: createPhotoMarker(point),
    }]
  }), [visiblePoints])

  return (
    <MapContainer
      className="leaflet-journey-map"
      center={[25, 15]}
      zoom={2}
      minZoom={2}
      maxZoom={18}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CountryViewport countryId={countryId} />
      {markers.map((marker) => (
        <Marker
          key={marker.key}
          position={marker.position}
          icon={marker.icon}
        />
      ))}
    </MapContainer>
  )
}
