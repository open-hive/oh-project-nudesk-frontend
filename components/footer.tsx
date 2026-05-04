import Link from "next/link";
import { ArrowRight, Share2, Globe, Briefcase, Camera, Phone, Mail, Printer, MessageCircle } from "lucide-react";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="bg-neutral-900 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Top Row: Logo, Social, Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-10 border-b border-white/10">
          <div>
            <Logo variant="light" className="mb-4" />
            <p className="text-[13px] text-white/60 leading-relaxed max-w-[320px] mb-6">
              Helping Botswana tutors earn from their knowledge with courses and sessions since 2024.
            </p>
            <div className="flex gap-2">
              <a href="#" className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:bg-accent hover:border-accent hover:text-white transition-all">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:bg-accent hover:border-accent hover:text-white transition-all">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:bg-accent hover:border-accent hover:text-white transition-all">
                <Briefcase className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:bg-accent hover:border-accent hover:text-white transition-all">
                <Camera className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-[15px] font-medium text-white mb-4">Feel free to reach us</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
                <span className="text-[13px] text-white/60">+267 7X XXX XXXX (Mon–Fri 8am–6pm CAT)</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
                <span className="text-[13px] text-white/60">hello@nudesk.co.bw</span>
              </div>
              <div className="flex items-start gap-2">
                <Printer className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
                <span className="text-[13px] text-white/60">+267 3X XXX XXXX (Office)</span>
              </div>
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
                <span className="text-[13px] text-white/60">WhatsApp: +267 7X XXX XXXX</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mid Row: Mega Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-10 border-b border-white/10">
          <div>
            <h3 className="text-[15px] font-medium text-white mb-5">Explore tutors by subject</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 mb-4">
              {["General mathematics", "Advanced sciences", "English comms", "Business studies", "Social sciences", "IT & programming", "Languages", "Arts & music", "BGCSE prep", "University prep"].map(link => (
                <Link key={link} href="/courses" className="text-[13px] text-white/60 hover:text-white transition-colors block truncate">{link}</Link>
              ))}
            </div>
            <Link href="/courses" className="text-[13px] text-accent hover:underline flex items-center gap-1">Explore all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div>
            <h3 className="text-[15px] font-medium text-white mb-5">Online sessions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 mb-4">
              {["Online science", "Online maths", "Online history", "Online English", "Online Setswana", "Online geography", "Online computer", "Online accounting", "Online physics", "Online chemistry"].map(link => (
                <Link key={link} href="/courses" className="text-[13px] text-white/60 hover:text-white transition-colors block truncate">{link}</Link>
              ))}
            </div>
            <Link href="/courses" className="text-[13px] text-accent hover:underline flex items-center gap-1">Explore all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>

        {/* Bottom Row: Links, Apps, Newsletter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pt-10 mb-8">
          <div>
            <h3 className="text-[15px] font-medium text-white mb-5">Useful links</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {["About", "Online classes", "Courses", "Programs", "Find tutors", "Sign in", "Join community", "FAQ"].map(link => (
                <Link key={link} href="#" className="text-[13px] text-white/60 hover:text-white transition-colors block truncate">{link}</Link>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-[15px] font-medium text-white mb-3">Get mobile app</h3>
            <p className="text-[13px] text-white/60 mb-4 max-w-[240px]">Take NuDesk on the go free on Android and iOS.</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 px-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium transition-colors text-center">
                Google Play
              </button>
              <button className="flex-1 py-2 px-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium transition-colors text-center">
                App Store
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[15px] font-medium text-white mb-3">Sign up for newsletter</h3>
            <p className="text-[13px] text-white/60 mb-4 max-w-[240px]">Get tutor growth tips, content ideas, and platform updates.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
              />
              <button className="bg-accent hover:bg-accent-hover text-white px-4 rounded-lg flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-6 border-t border-white/10">
          <p className="text-[12px] text-white/40">
            &copy; {new Date().getFullYear()} NuDesk. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
