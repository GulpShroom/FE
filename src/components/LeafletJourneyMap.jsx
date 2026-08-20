import { useEffect, useMemo, useRef } from 'react'
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

function resolveJourneyId(point) {
  const id = point?.journeyId ?? point?.id ?? point?.journey_id
  if (id == null || id === '') return null
  return id
}

function createPhotoMarker(point) {
  const root = document.createElement('div')
  root.className = 'leaflet-journey-marker'

  const image = document.createElement('img')
  image.src = point.photoUrl || point.thumbnailUrl || journeyThumb
  image.alt = ''
  image.draggable = false
  root.append(image)

  if (point.value != null) {
    const count = document.createElement('span')
    count.textContent = String(point.value)
    root.append(count)
  }

  return L.divIcon({
    className: 'leaflet-journey-marker-wrap',
    html: root,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  })
}

export function LeafletJourneyMap({ points = [], countryId = 'all', onMarkerClick }) {
  const onClickRef = useRef(onMarkerClick)
  onClickRef.current = onMarkerClick

  const visiblePoints = useMemo(
    () => points.filter((point) => (
      countryId === 'all' || String(point.country).toLowerCase() === countryId
    )),
    [countryId, points],
  )

  const markers = useMemo(() => visiblePoints.flatMap((point, index) => {
    const pointCountryId = String(point.country || '').toLowerCase()
    const fallbackCenter = countryById.get(pointCountryId)?.center
    const position = Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
      ? [point.latitude, point.longitude]
      : fallbackCenter

    if (!position) return []

    const journeyId = resolveJourneyId(point)
    const normalizedPoint = journeyId == null ? point : { ...point, journeyId }

    return [{
      key: String(journeyId ?? `${pointCountryId}-${index}-${position[0]}-${position[1]}`),
      point: normalizedPoint,
      position,
      icon: createPhotoMarker(normalizedPoint),
    }]
  }), [visiblePoints])

  const clickable = typeof onMarkerClick === 'function'

  return (
    <MapContainer
      className={`leaflet-journey-map${clickable ? ' leaflet-journey-map--clickable' : ''}`}
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
          interactive={clickable}
          keyboard={clickable}
          bubblingMouseEvents={false}
          eventHandlers={
            clickable
              ? {
                  click: (event) => {
                    // 지도 클릭으로 전파되지 않게만 막고, Leaflet 마커 클릭은 유지
                    if (event.originalEvent) {
                      L.DomEvent.stopPropagation(event.originalEvent)
                    }
                    onClickRef.current?.(marker.point)
                  },
                }
              : undefined
          }
        />
      ))}
    </MapContainer>
  )
}
