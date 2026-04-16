"use client";
import React from "react";

export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full w-full">{children}</div>;
}