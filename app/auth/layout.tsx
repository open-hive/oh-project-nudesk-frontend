import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Check } from "lucide-react";
import Link from "next/link";

const benefits = [
  "3,200+ courses from vetted experts",
  "Live sessions with real-time Q&A",
  "Certificates you can share anywhere",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-neutral-50/50">
      {/* Top left logo linking home */}
      <div className="absolute top-8 left-8">
        <Logo variant="dark" />
      </div>

      {/* Main content area */}
      <div className="w-full flex justify-center p-6 md:p-10">
        {children}
      </div>
    </div>
  );
}
