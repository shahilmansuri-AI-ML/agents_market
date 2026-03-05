import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Lock, Mail } from "lucide-react"; // Added icons for flair
import Link from "next/link"; // Ensure you're using the correct Link for your framework
import React from "react";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      {/* Container Card */}
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg border border-slate-200">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500">Enter your credentials to access your account</p>
        </div>

        <form className="flex flex-col gap-5" >
          <div className="space-y-2">
            <label htmlFor="Email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" /> Email
            </label>
            <Input 
              type="email" 
              id="Email" 
              placeholder="name@example.com" 
              className="focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="Password" className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" /> Password
            </label>
            <Input 
              type="password" 
              id="Password" 
              placeholder="••••••••"
              className="focus-visible:ring-blue-500"
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
            Login
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 font-semibold">Or</span>
          </div>
        </div>

        {/* Dashboard Shortcut */}
        <Link href="/dashboard" passHref>
          <Button
            variant="outline"
            size="lg"
            className="w-full group border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-all"
          >
            Launch Dashboard
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;