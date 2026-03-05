"use client"; // Client-side interactivity ke liye zaroori hai

import { useState } from "react";
import DisplayComponent from "./DisplayComponent";

export default function Home() {
  // Dropdown ki state handle karne ke liye
  const [role, setRole] = useState("User");

  return (
    <div className="p-10 font-sans bg-white text-black dark:bg-white dark:text-black">
      <h1 className="text-2xl font-bold mb-4">Role Selector</h1>
      
      {/* Dropdown Section */}
      <div className="mb-8">
        <label className="block mb-2 font-medium">Select User Name/Role:</label>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          className="p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="User">User</option>
          <option value="Tenant">Tenant</option>
          <option value="Owner">Owner</option>
        </select>
      </div>

      <hr className="my-6" />

      {/* Yahan hum selected value ko child component mein as a Prop bhej rahe hain */}
      <DisplayComponent selectedRole={role} />
    </div>
  );
}