import { motion } from "motion/react";
import { PlayCircle, Star, Users, Calendar, ArrowRight } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { cn } from "../utils";

const webinars = [
  { id: 1, title: "Mindful Leadership in Tech", expert: "Dr. Sarah Chen", img: "https://images.unsplash.com/photo-1695462131822-368776114494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWxsbmVzcyUyMHdlYmluYXJ8ZW58MXx8fHwxNzc0MTY2Nzk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", time: "Tomorrow, 2:00 PM", tags: ["Webinar"] },
  { id: 2, title: "Bali Healing Retreat '26", expert: "Lumina Wellness", img: "https://images.unsplash.com/photo-1644612105654-b6b0a941ecde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwcmV0cmVhdHxlbnwxfHx8fDE3NzQxNjY3OTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", time: "Nov 12 - 16", tags: ["Retreat", "Paid"] },
];

const articles = [
  { id: 1, title: "The Science of Deep Sleep & Recovery", readTime: "5 min", category: "Lifestyle", img: "https://images.unsplash.com/photo-1670164747721-d3500ef757a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG51dHJpdGlvbnxlbnwxfHx8fDE3NzQxMTY5NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 2, title: "Gut-Brain Axis: Nutrition Basics", readTime: "8 min", category: "Physical", img: "https://images.unsplash.com/photo-1670164747721-d3500ef757a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG51dHJpdGlvbnxlbnwxfHx8fDE3NzQxMTY5NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
];

export function DiscoverScreen() {
  return (
    <div className="flex flex-col gap-6 p-6 pt-12 overflow-x-hidden">
      <header className="mb-2">
        <h1 className="text-3xl font-semibold text-slate-800 tracking-tight">
          Discover
        </h1>
        <p className="text-slate-500 font-medium mt-1 text-[15px]">
          Webinars, retreats, and daily insights
        </p>
      </header>

      {/* Newsletter Signup (Requested Feature) */}
      <GlassCard className="p-5 flex items-center justify-between bg-gradient-to-r from-indigo-100 to-emerald-50 border-none shadow-md">
        <div>
          <h3 className="font-semibold text-slate-800">Company Newsletter</h3>
          <p className="text-slate-500 text-xs mt-1">Weekly wellness digest</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-600/20 active:scale-95 transition-all">
          Subscribe
        </button>
      </GlassCard>

      {/* Webinars & Retreats */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Upcoming Events</h2>
          <button className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
            See all
          </button>
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
              <GlassCard className="overflow-hidden flex flex-col p-0 h-[280px] hover:shadow-xl transition-all group cursor-pointer border border-white/40">
                <div className="h-[140px] w-full relative overflow-hidden">
                  <img src={event.img} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {event.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-semibold text-white uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-slate-800 text-lg leading-tight mb-1">{event.title}</h3>
                  <p className="text-sm text-slate-500 font-medium mb-auto flex items-center gap-1">
                    <Users className="w-3 h-3" /> {event.expert}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md">
                      <Calendar className="w-3 h-3" /> {event.time}
                    </span>
                    <button className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md active:scale-95 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recommended Content */}
      <section>
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-4">For You</h2>
        <div className="space-y-4">
          {articles.map((article, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              key={article.id}
            >
              <GlassCard className="p-3 flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-white/50">
                  <img src={article.img} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 pr-2">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{article.category}</span>
                  <h3 className="font-semibold text-slate-800 leading-snug mt-0.5 line-clamp-2">{article.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-400">
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{article.readTime} listen</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonial (Requested Feature) */}
      <GlassCard className="p-6 mt-4 bg-white/60 text-center border-dashed border-2 border-indigo-100 mb-8">
        <Star className="w-6 h-6 text-amber-400 mx-auto mb-3" fill="currentColor" />
        <p className="text-sm text-slate-600 font-medium italic mb-3">
          "Aura completely transformed how our team manages stress. The daily wellness wheel checks are game-changing."
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-slate-200 rounded-full" />
          <span className="text-xs font-semibold text-slate-800">Sarah J., HR Director</span>
        </div>
      </GlassCard>
    </div>
  );
}
