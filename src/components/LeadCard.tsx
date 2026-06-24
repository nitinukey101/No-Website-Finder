import React from "react";
import { 
  Star, 
  Phone, 
  Globe, 
  MapPin, 
  Bookmark, 
  BookmarkCheck, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  Percent
} from "lucide-react";
import { Business } from "../types";

interface LeadCardProps {
  key?: string;
  business: Business;
  isSaved: boolean;
  onToggleSave: (b: Business) => void;
  onViewDetails?: (b: Business) => void;
}

export default function LeadCard({ business, isSaved, onToggleSave, onViewDetails }: LeadCardProps) {
  const {
    name,
    phone,
    rating,
    reviewCount,
    website,
    address,
    category,
    opportunityScore,
    leadPriority,
    profileCompleteness,
    missingWebsite,
    missingPhone,
    lowReviews,
    lowRating
  } = business;

  // Determine colors based on priority
  const priorityStyles = {
    HIGH: {
      bg: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30",
      indicator: "bg-rose-500",
      text: "High Priority"
    },
    MEDIUM: {
      bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/20",
      indicator: "bg-amber-500",
      text: "Medium Priority"
    },
    LOW: {
      bg: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800",
      indicator: "bg-slate-400",
      text: "Low Priority"
    }
  };

  const priorityStyle = priorityStyles[leadPriority] || priorityStyles.LOW;

  // Helper to color the opportunity score
  const getScoreColorClass = (score: number) => {
    if (score >= 75) return "text-rose-600 dark:text-rose-400";
    if (score >= 45) return "text-amber-500 dark:text-amber-400";
    return "text-teal-600 dark:text-teal-400";
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 75) return "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300";
    if (score >= 45) return "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300";
    return "bg-teal-100 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300";
  };

  return (
    <div 
      id={`lead-card-${business.id}`}
      className={`relative flex flex-col justify-between bg-white dark:bg-slate-950 border rounded-2xl p-5 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200 ${
        missingWebsite 
          ? "border-rose-200/80 dark:border-rose-900/40 bg-radial from-white to-rose-50/[0.12] dark:from-slate-950 dark:to-rose-950/[0.04]" 
          : "border-slate-200 dark:border-slate-900"
      }`}
    >
      {/* Top Header Row with Category and Lead Priority */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
          {category || "Local Business"}
        </span>
        
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${priorityStyle.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.indicator}`} />
          {priorityStyle.text}
        </span>
      </div>

      {/* Business Name */}
      <div className="mb-2">
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
          {name}
        </h3>
        <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{address}</span>
        </p>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 gap-3 py-3 my-2 border-y border-slate-100 dark:border-slate-900/60 text-slate-700 dark:text-slate-300">
        {/* Phone */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Phone</span>
          <a 
            href={phone !== "No Phone" ? `tel:${phone}` : "#"} 
            className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${
              missingPhone 
                ? "text-slate-400 dark:text-slate-600 cursor-not-allowed line-through" 
                : "text-blue-600 dark:text-blue-400 hover:underline"
            }`}
            onClick={(e) => missingPhone && e.preventDefault()}
          >
            <Phone size={13} className="shrink-0" />
            <span className="truncate">{phone}</span>
          </a>
        </div>

        {/* Reviews & Ratings */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Rating & Reviews</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-xs font-semibold">{rating > 0 ? rating : "N/A"}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              ({reviewCount} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Key Highlights (Missing items etc) */}
      <div className="space-y-2 mb-4">
        {/* Website status highlight */}
        {missingWebsite ? (
          <div className="flex items-center gap-2 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 p-2.5 rounded-xl border border-rose-100/50 dark:border-rose-950/30">
            <AlertTriangle size={15} className="text-rose-500 shrink-0 animate-pulse" />
            <div className="flex-1">
              <span className="font-semibold block">No Website Found</span>
              <span className="text-[10px] opacity-90">High-value design lead opportunity!</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-xl border border-emerald-100/40 dark:border-emerald-950/20">
            <CheckCircle size={15} className="text-emerald-500 shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-semibold block truncate">Has Website</span>
              <a 
                href={website || "#"} 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
              >
                {website?.replace("https://", "").replace("www.", "")}
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        )}

        {/* Profile Completeness Gauge */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900/40">
          <div className="flex justify-between items-center mb-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span>Profile Completeness</span>
            <span>{profileCompleteness}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                profileCompleteness < 50 ? "bg-amber-500" : "bg-teal-500"
              }`}
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Opportunity Score Block & Save Actions */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-900/50">
        <div className="flex items-center gap-2">
          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl ${getScoreBgClass(opportunityScore)}`}>
            <span className="text-lg font-black tracking-tight leading-none">{opportunityScore}</span>
            <span className="text-[8px] font-bold uppercase tracking-wider text-opacity-80">Score</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">Opportunity</span>
            <span className={`text-xs font-bold leading-none ${getScoreColorClass(opportunityScore)}`}>
              {opportunityScore >= 75 ? "🔥 Exceptional" : opportunityScore >= 45 ? "⚡ High Value" : "❄️ Standard"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(business)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Analyze
            </button>
          )}

          <button
            id={`toggle-save-btn-${business.id}`}
            onClick={() => onToggleSave(business)}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer min-h-[40px] min-w-[40px] ${
              isSaved 
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700" 
                : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
            title={isSaved ? "Saved to Leads CRM" : "Save to Leads CRM"}
          >
            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
