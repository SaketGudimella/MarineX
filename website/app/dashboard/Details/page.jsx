'use client';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { logout } from '@/app/logout/actions';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function personalDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const chatContainerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        redirect('/login');
      } else {
        setUser(data.user);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchCustomPrediction = async (event) => {
    event.preventDefault();
    if (!userMessage.trim()) return;

    setLoading(true);
    setError(null);
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: userMessage },
    ]);

    try {
      const response = await fetch('http://127.0.0.1:8000/chatbot/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          start_date: '01-01-2019',
          end_date: '01-10-2024',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch steel price prediction');
      }

      const botMessage = await response.json();
      const formattedBotMessage = botMessage['llm_output'];
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { role: 'bot', content: formattedBotMessage },
      ]);
    } catch (error) {
      console.error('Error fetching custom steel price data:', error);
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { role: 'bot', content: 'Error fetching custom steel price data.' },
      ]);
    } finally {
      setLoading(false);
      setUserMessage('');
    }
  };

  // Server-side function to query the Hugging Face model
  const query = async (filename) => {
    const response = await fetch("/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    });

    const result = await response.json();
    return result;
  };

  const handleFileUpload = async (event) => {
    
    const file = event.target.files[0];
    if (file) {
      const result = await query(file);
      console.log(result);
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { role: 'bot', content: `Gradio Result: ${JSON.stringify(result)}` },
      ]);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">RAG Model</h1>
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
                href="/dashboard/Graphs"
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Maps
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Chat with the llm by speech</h2>
          <div
            ref={chatContainerRef}
            className="overflow-auto max-h-80 border border-gray-300 rounded-lg p-4 mb-4"
          >
            {chatMessages.map((message, index) => (
              <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : ''}`}>
                <strong>{message.role === 'user' ? 'You' : 'Bot'}:</strong> {message.content}
              </div>
            ))}
          </div>

          <form onSubmit={fetchCustomPrediction} className="flex">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg p-2 mr-2"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Send
            </button>
          </form>
          <input
            type="file"
            accept=".flac, .mp3"
            onChange={handleFileUpload}
            className="mt-4"
          />
        </div>
      </main>
    </div>
  );
}
