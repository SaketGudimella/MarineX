'use client';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { logout } from '@/app/logout/actions';
import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [ocrResult, setOcrResult] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        redirect('/login');
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      setOcrResult(result.text); // Assuming the OCR API returns a text property
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">maps</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 mr-4">Hello, {user.email}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                  Logout
                </button>
              </form>
              <Link
                href="/dashboard"
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Home
              </Link>
              <Link
                href="/dashboard/Details"
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Model
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-4">Welcome to the marine x map</h2>
          <p className="text-gray-700">
            Here you can view curated maps with the latest detailed reports from the rag model and ocr.
          </p>
          <VesselMap /> {/* Add VesselMap component here */}
          
          <form onSubmit={handleFileUpload} className="mt-6">
            <input 
              type="file" 
              accept=".md,.jpg,.jpeg,.png"
              onChange={handleFileChange} 
              required
              className="mb-4"
            />
            <button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Upload Document
            </button>
          </form>

          {ocrResult && (
            <div className="mt-6 p-4 border border-gray-300 rounded">
              <h3 className="text-lg font-bold">OCR Result:</h3>
              <p>{ocrResult}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
