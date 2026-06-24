import React from "react";

interface AdUnitProps {
  slotId?: string;
  format?: "banner" | "sidebar" | "leaderboard";
}

export default function AdUnit({ slotId = "default-slot", format = "banner" }: AdUnitProps) {
  // Map formats to popular desktop & mobile responsive dimensions
  const formatClasses = {
    banner: "w-full min-h-[100px] sm:min-h-[120px] bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-center items-center text-center",
    sidebar: "w-full min-h-[250px] bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-center items-center text-center",
    leaderboard: "w-full min-h-[90px] bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-center items-center text-center",
  };

  return (
    <div className={`my-4 relative overflow-hidden group select-none transition-all duration-300 ${formatClasses[format]}`}>
      {/* Visual background pattern to resemble AdSense slots */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-100/30 to-blue-50/20 dark:from-slate-900/10 dark:to-blue-950/10 pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 tracking-wider uppercase mb-1">
          Sponsored advertisement
        </span>
        
        {/* Placeholder info matching Google AdSense recommendations */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-xs font-bold">
            Ad
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {format === "leaderboard" 
              ? "Boost Your Local Agency Sales Pipeline with CRM Pro"
              : format === "sidebar"
              ? "Target High-Intent Leads needing Responsive Websites & SEO"
              : "No-Code Website Builder: Launch Sites in 5 Minutes for Clients"
            }
          </span>
        </div>
        
        <span className="text-[10px] text-slate-400/80 dark:text-slate-500/80 mt-1">
          adsense-slot-id-{slotId}
        </span>
      </div>
    </div>
  );
}
