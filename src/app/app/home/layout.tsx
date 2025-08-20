'use client';

import { Toaster } from "sonner";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
      <Toaster richColors position="top-right" />
    </div>
  );
}