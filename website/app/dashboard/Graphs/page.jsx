'use client';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { logout } from '@/app/logout/actions';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic'; // Import Next.js dynamic

 const VesselMap = dynamic(() => import('../../../components/VesselMap'), { ssr: false });


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
