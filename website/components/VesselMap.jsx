import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const VesselMap = () => {
  const locations = [
    {
      Location: [12.345, 78.91],
      Time: "Present",
      Direction: "North-East",
      ObjectType: "Fishing Vessel",
      ObjectDescription: "Engine failure, drifting towards a reef, crew of 10, cargo of fish.",
      Source: "Distress Signal",
      ConfidenceLevel: "High"
    },
    {
      Location: [12.34, 45.67],
      Time: "05.30 UTC",
      Direction: "northeast",
      ObjectType: "vessel",
      ObjectDescription: "Unidentified, moving at 12 knots",
      Source: "human observation",
      ConfidenceLevel: "high"
    }
  ];

  useEffect(() => {
    const map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const fishingVesselSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <path d="M9 22V12h6v10"/>
        <path d="M12 7v3"/>
      </svg>
    `;

    const genericVesselSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `;

    const createCustomIcon = (svg, color) => {
      return L.divIcon({
        html: svg.replace('currentColor', color),
        className: 'custom-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      });
    };

    const bounds = L.latLngBounds();

    locations.forEach(loc => {
      const [lat, lng] = loc.Location;
      bounds.extend([lat, lng]);

      const popupContent = `
        <div class="p-2">
          <h3 class="font-bold">${loc.ObjectType}</h3>
          <p><strong>Time:</strong> ${loc.Time}</p>
          <p><strong>Direction:</strong> ${loc.Direction}</p>
          <p><strong>Description:</strong> ${loc.ObjectDescription}</p>
          <p><strong>Source:</strong> ${loc.Source}</p>
          <p><strong>Confidence:</strong> ${loc.ConfidenceLevel}</p>
        </div>
      `;

      const icon = loc.ObjectType.toLowerCase().includes('fishing')
        ? createCustomIcon(fishingVesselSvg, '#2563eb') 
        : createCustomIcon(genericVesselSvg, '#dc2626'); 

      if (!document.querySelector('#custom-icon-styles')) {
        const style = document.createElement('style');
        style.id = 'custom-icon-styles';
        style.textContent = `
          .custom-icon {
            background: none;
            border: none;
          }
          .custom-icon svg {
            width: 24px;
            height: 24px;
          }
        `;
        document.head.appendChild(style);
      }

      L.marker([lat, lng], { icon })
        .bindPopup(popupContent)
        .addTo(map);
    });

    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      map.remove();
      const style = document.querySelector('#custom-icon-styles');
      if (style) style.remove();
    };
  }, []);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
      <div id="map" className="w-full h-full"></div>
    </div>
  );
};