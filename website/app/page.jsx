import Link from "next/link";
import { GoToLogin } from "./GoToLogin/actions";


export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-black">
      <h1 className="text-3xl font-bold mb-8">Welcome to Optimanufacture</h1>
      
      <h2 className="text-4xl font-bold text-center mb-4">
        Get the Best Steel prices<br/>
        Anytime Anywhere !!
      </h2>
      
      <p className="text-center mb-8 max-w-2xl">
        Optimafucture is a scm optimization website.
        We give real time and accurate predictions on steel prices
        and recommendations on procurement optimization to get
        steel at the best possible prices to fulfill your needs
      </p>
      
      <div className="flex space-x-4">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300">
          <Link href="/login">
          get started
          </Link>
        </button>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300">
          Services
        </button>
      </div>
    </div>
  );
};
