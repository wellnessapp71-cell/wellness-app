"use client";

import { motion } from "motion/react";
import { PlayCircle, Star, Users, Calendar } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { cn } from "@/lib/utils";

const webinars = [
  { id: 1, title: "Mindful Leadership in Tech", expert: "Dr. Sarah Chen", img: "https://images.unsplash.com/photo-1695462131822-368776114494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWxsbmVzcyUyMHdlYmluYXJ8ZW58MXx8fHwxNzc0MTY2Nzk5fDA&ixlib=rb-4.1.0&q=80&w=1080", time: "Tomorrow, 2:00 PM", tags: ["Webinar"] },
  { id: 2, title: "Bali Healing Retreat '26", expert: "Lumina Wellness", img: "https://images.unsplash.com/photo-1644612105654-b6b0a941ecde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwcmV0cmVhdHxlbnwxfHx8fDE3NzQxNjY3OTl8MA&ixlib=rb-4.1.0&q=80&w=1080", time: "Nov 12 - 16", tags: ["Retreat", "Paid"] },
];

const articles = [
  { id: 1, title: "The Science of Deep Sleep & Recovery", readTime: "5 min", category: "Lifestyle", img: "https://images.unsplash.com/photo-1670164747721-d3500ef757a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG51dHJpdGlvbnxlbnwxfHx8fDE3NzQxMTY5NTl8MA&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: 2, title: "Gut-Brain Axis: Nutrition Basics", readTime: "8 min", category: "Physical", img: "https://images.unsplash.com/photo-1670164747721-d3500ef757a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG51dHJpdGlvbnxlbnwxfHx8fDE3NzQxMTY5NTl8MA&ixlib=rb-4.1.0&q=80&w=1080" },
];

export default function DiscoverPage() {
  return (
    <div className="flex flex-col gap-8 p-6 pt-12 overflow-x-hidden">
      <header className="mb-2">
        <h1 className="text-[34px] leading-tight font-bold text-black tracking-tight mb-1">
          Discover
        </h1>
        <p className="text-[17px] text-[#8A8A8E] font-medium tracking-tight">
          Webinars, retreats, and daily insights
        </p>
      </header>

      {/* Newsletter Signup */}
      <GlassCard className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-black text-[17px] tracking-tight">Weekly Digest</h3>
          <p className="text-[15px] text-[#8A8A8E] mt-0.5">Wellness tips delivered to you</p>
        </div>
        <button className="px-5 py-2 w-full sm:w-auto bg-[#007AFF] text-white rounded-full text-[15px] font-semibold active:opacity-70 transition-opacity">
          Subscribe
        </button>
      </GlassCard>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[22px] font-bold text-black tracking-tight">Upcoming Events</h2>
          <button className="text-[#007AFF] text-[15px] font-medium active:opacity-70">See All</button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x snap-mandatory">
          {webinars.map((event, idx) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={event.id}
              className="min-w-[280px] snap-center shrink-0"
            >
              <GlassCard className="overflow-hidden flex flex-col p-0 h-[300px] cursor-pointer active:scale-[0.98] transition-transform">
                <div className="h-[160px] w-full relative overflow-hidden bg-[#E5E5EA]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.img} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {event.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-[#000000]/40 backdrop-blur-md rounded-md text-[11px] font-bold text-white uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1 bg-white">
                  <h3 className="font-bold text-black text-[18px] leading-tight mb-1">{event.title}</h3>
                  <p className="text-[14px] text-[#8A8A8E] font-medium mb-auto flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {event.expert}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[13px] font-semibold text-[#FF2D55] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> {event.time}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* For You */}
      <section>
        <h2 className="text-[22px] font-bold text-black tracking-tight mb-3">For You</h2>
        <GlassCard className="flex flex-col overflow-hidden">
          {articles.map((article, idx) => (
            <div key={article.id} className={cn("p-4 flex items-center gap-4 bg-white cursor-pointer active:opacity-70 transition-opacity", idx !== articles.length - 1 && "border-b border-[#3C3C43]/[0.05]")}>
              <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-[#E5E5EA]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.img} alt={article.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 pr-2">
                <span className="text-[11px] font-bold text-[#FF9500] uppercase tracking-wider">{article.category}</span>
                <h3 className="font-semibold text-black text-[16px] leading-snug mt-0.5 max-w-[90%]">{article.title}</h3>
                <div className="flex items-center gap-1.5 mt-1 text-[13px] font-medium text-[#8A8A8E]">
                  <PlayCircle className="w-4 h-4" />
                  <span>{article.readTime} listen</span>
                </div>
              </div>
            </div>
          ))}
        </GlassCard>
      </section>

      {/* Testimonial */}
      <GlassCard className="p-6 mt-2 mb-8 bg-white flex flex-col items-center justify-center text-center">
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-[#FF9500]" fill="currentColor" />)}
        </div>
        <p className="text-[15px] text-black font-medium leading-relaxed mb-4">
          &quot;Aura completely transformed how our team manages stress. The daily wellness wheel checks are game-changing.&quot;
        </p>
        <span className="text-[13px] font-semibold text-[#8A8A8E]">Sarah J. • HR Director</span>
      </GlassCard>
    </div>
  );
}
