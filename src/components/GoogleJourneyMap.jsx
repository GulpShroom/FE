import { useEffect, useMemo, useRef, useState } from 'react'

let googleMapsPromise

const COUNTRY_POSITIONS = {
  us: { lat: 39.5, lng: -98.35 },
  fr: { lat: 46.23, lng: 2.21 },
  kr: { lat: 36.5, lng: 127.9 },
  jp: { lat: 36.2, lng: 138.25 },
  it: { lat: 41.87, lng: 12.57 },
}

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  if (googleMapsPromise) return googleMapsPromise

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__mcarryGoogleMapsReady'
    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: apiKey,
      v: 'weekly',
      libraries: 'marker',
      callback: callbackName,
      language: 'ko',
    })

    window[callbackName] = () => {
      delete window[callbackName]
      resolve(window.google.maps)
    }
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`
    script.async = true
    script.onerror = () => {
      delete window[callbackName]
      googleMapsPromise = null
      reject(new Error('Google Maps JavaScript API를 불러오지 못했습니다.'))
    }
    document.head.append(script)
  })

  return googleMapsPromise
}

export function GoogleJourneyMap({ fallbackSrc, points = [], countryId = 'all' }) {
  const mapRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const visiblePoints = useMemo(
    () => points.filter((point) => countryId === 'all' || point.country === countryId),
    [countryId, points],
  )

  useEffect(() => {
    if (!apiKey || !mapRef.current) return undefined

    let cancelled = false
    let markers = []

    loadGoogleMaps(apiKey)
      .then(async (maps) => {
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
          maps.importLibrary('maps'),
          maps.importLibrary('marker'),
        ])
        if (cancelled || !mapRef.current) return

        const selectedPosition = countryId === 'all' ? null : COUNTRY_POSITIONS[countryId]
        const map = new Map(mapRef.current, {
          center: selectedPosition ?? { lat: 25, lng: 15 },
          zoom: selectedPosition ? 4 : 1.7,
          minZoom: 1,
          mapId: 'DEMO_MAP_ID',
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          backgroundColor: '#ffffff',
        })

        markers = visiblePoints.flatMap((point) => {
          const position = COUNTRY_POSITIONS[point.country]
          if (!position) return []
          const content = document.createElement('div')
          content.className = 'google-journey-map__marker'
          content.textContent = String(point.value)
          return [new AdvancedMarkerElement({ map, position, content })]
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      markers.forEach((marker) => { marker.map = null })
    }
  }, [apiKey, countryId, visiblePoints])

  if (!apiKey || failed) {
    return <img className="map-panel__img" src={fallbackSrc} alt="여정 지도" width={335} height={263} />
  }

  return <div ref={mapRef} className="google-journey-map" aria-label="여정 지도" />
}
