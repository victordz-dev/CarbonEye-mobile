export const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f8fafc; }
    /* Estilização para o tooltip do número do vértice */
    .leaflet-tooltip-own {
      background: #0284c7;
      color: #ffffff;
      border: none;
      font-weight: bold;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .custom-area-label {
      background: rgba(255, 255, 255, 0.85);
      color: #0f172a;
      border: none;
      font-weight: bold;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([-22.9068, -47.0613], 13);
    
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      detectRetina: true,
      attribution: '© Google Maps'
    }).addTo(map);

    var markerGroup = L.featureGroup().addTo(map);
    var existingAreasGroup = L.featureGroup().addTo(map);
    var polygon = null;
    var polyline = null;

    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      var message = JSON.stringify({
        type: 'MAP_CLICK',
        coordinate: { latitude: lat, longitude: lng }
      });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(message);
      } else {
        window.parent.postMessage(message, '*');
      }
    });

    function handleMessage(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'UPDATE_AREAS') {
          existingAreasGroup.clearLayers();
          data.areas.forEach(function(area) {
            var poly = L.polygon(area.coordinates, {
              color: '#64748b',
              fillColor: 'rgba(100, 116, 139, 0.4)',
              weight: 2
            }).addTo(existingAreasGroup);

            // Add center icon marker
            var center = poly.getBounds().getCenter();
            var iconHtml = '<div style="font-size: 20px; text-shadow: 0 0 4px rgba(255,255,255,1); display: flex; justify-content: center; align-items: center;">📍</div>';
            var customIcon = L.divIcon({ html: iconHtml, className: 'custom-area-marker', iconSize: [24, 24], iconAnchor: [12, 24] });
            
            L.marker(center, { icon: customIcon })
              .bindTooltip(area.nome, { permanent: true, direction: 'bottom', offset: [0, 5], className: 'custom-area-label', opacity: 0.9 })
              .addTo(existingAreasGroup);
          });
        }
        else if (data && data.type === 'UPDATE_POINTS') {
          markerGroup.clearLayers();
          if (polygon) {
            map.removeLayer(polygon);
            polygon = null;
          }
          if (polyline) {
            map.removeLayer(polyline);
            polyline = null;
          }

          const pts = data.points;
          const latLngs = pts.map(p => [p.latitude, p.longitude]);

          // Add markers (as vector circle markers to avoid image URL loading failures)
          pts.forEach((p, idx) => {
            L.circleMarker([p.latitude, p.longitude], {
              radius: 6,
              fillColor: '#0284c7',
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9
            })
            .bindTooltip((idx + 1).toString(), { permanent: true, direction: 'top', className: 'leaflet-tooltip-own' })
            .addTo(markerGroup);
          });

          // Add polygon or polyline
          if (latLngs.length >= 3) {
            polygon = L.polygon(latLngs, {
              color: '#0284c7',
              fillColor: 'rgba(2, 132, 199, 0.3)',
              weight: 2
            }).addTo(map);
            if (data.fitBounds) {
              map.fitBounds(polygon.getBounds(), { padding: [40, 40] });
            }
          } else if (latLngs.length === 2) {
            polyline = L.polyline(latLngs, {
              color: '#0284c7',
              weight: 2,
              dashArray: '5, 5'
            }).addTo(map);
            if (data.fitBounds) {
              var bounds = L.latLngBounds(latLngs);
              map.fitBounds(bounds, { maxZoom: 15, padding: [40, 40] });
            }
          } else if (latLngs.length > 0) {
            if (data.fitBounds) {
              var bounds = L.latLngBounds(latLngs);
              map.fitBounds(bounds, { maxZoom: 15, padding: [40, 40] });
            }
          }
        }
      } catch (e) {
        console.error('Error processing message in WebView:', e);
      }
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);
  </script>
</body>
</html>
`;
