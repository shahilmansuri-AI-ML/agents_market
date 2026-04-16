"use client";

import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
      <Icon className="w-8 h-8 text-indigo-600 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-300">{description}</p>
    </div>
  );
}
