import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Briefcase, 
  HelpCircle, 
  Moon, 
  Sun, 
  SlidersHorizontal, 
  ArrowRight, 
  TrendingUp, 
  X, 
  FileSpreadsheet, 
  Download, 
  Phone, 
  Globe, 
  Star,
  Info,
  CheckCircle,
  AlertTriangle,
  Mail,
  Copy,
  ChevronRight,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Business, SavedLead, SearchParams, SearchFilters } from "./types";
import LeadCard from "./components/LeadCard";
import SavedLeadsCRM from "./components/SavedLeadsCRM";
import SettingsPanel from "./components/SettingsPanel";
import AdUnit from "./components/AdUnit";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"search" | "crm" | "help">("search");
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("no_website_finder_dark_mode");
    return saved ? saved === "true" : false;
  });

  // Search parameters
  const [searchParams, setSearchParams] = useState<SearchParams>({
    category: "Dentist",
    city: "Boston",
    state: "MA",
    radius: 10
  });

  // Results & API Connection state
  const [places, setPlaces] = useState<Business[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // CRM State
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>(() => {
    const saved = localStorage.getItem("no_website_finder_saved_leads");
    return saved ? JSON.parse(saved) : [];
  });

  // Filters State
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    onlyNoWebsite: true,
    minRating: 0,
    minReviews: 0,
    minOpportunityScore: 0,
    priority: "ALL",
    searchQuery: ""
  });

  // Modal Detail State
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [pitchTone, setPitchTone] = useState<"friendly" | "analytical" | "urgent">("friendly");

  // Sync dark mode class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("no_website_finder_dark_mode", String(darkMode));
  }, [darkMode]);

  // Sync saved leads to localStorage
  useEffect(() => {
    localStorage.setItem("no_website_finder_saved_leads", JSON.stringify(savedLeads));
  }, [savedLeads]);

  // Initial demo search on load to present a rich initial interface
  useEffect(() => {
    handleSearch(false);
  }, []);

  // Search trigger
  const handleSearch = async (loadMore = false) => {
    if (loadMore && !nextPageToken) return;

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
      setInfoMessage(null);
    }

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: searchParams.category,
          city: searchParams.city,
          state: searchParams.state,
          radius: searchParams.radius,
          pageToken: loadMore ? nextPageToken : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setIsLiveMode(data.isLive || false);

      if (data.fallbackReason) {
        setInfoMessage(data.fallbackReason);
      } else if (data.warning) {
        setInfoMessage(data.warning);
      }

      if (loadMore) {
        setPlaces(prev => [...prev, ...data.places]);
      } else {
        setPlaces(data.places || []);
      }
      setNextPageToken(data.nextPageToken || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please check your inputs and connection.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // CRM Operations
  const handleToggleSave = (business: Business) => {
    const isSaved = savedLeads.some(l => l.id === business.id);
    if (isSaved) {
      setSavedLeads(prev => prev.filter(l => l.id !== business.id));
    } else {
      const newLead: SavedLead = {
        ...business,
        savedAt: new Date().toISOString(),
        status: "New",
        notes: "",
        potentialDealSize: !business.website ? 1500 : 500
      };
      setSavedLeads(prev => [newLead, ...prev]);
    }
  };

  const handleRemoveLead = (id: string) => {
    setSavedLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdateLeadStatus = (id: string, status: SavedLead["status"]) => {
    setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const handleUpdateLeadNotes = (id: string, notes: string) => {
    setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
  };

  const handleUpdateDealSize = (id: string, size: number) => {
    setSavedLeads(prev => prev.map(l => l.id === id ? { ...l, potentialDealSize: size } : l));
  };

  // Filters logic
  const filteredPlaces = places.filter(place => {
    if (filters.onlyNoWebsite && place.website) return false;
    if (place.rating < filters.minRating) return false;
    if (place.reviewCount < filters.minReviews) return false;
    if (place.opportunityScore < filters.minOpportunityScore) return false;
    if (filters.priority !== "ALL" && place.leadPriority !== filters.priority) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      return (
        place.name.toLowerCase().includes(q) ||
        place.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Dynamic outreach pitch script based on business attributes
  const generatePitchText = (lead: Business) => {
    const bizName = lead.name;
    const city = searchParams.city;
    const ratingText = lead.rating > 0 ? `impressive ${lead.rating}-star rating` : "stellar profile";
    const reviewsText = lead.reviewCount > 0 ? ` with ${lead.reviewCount} customer reviews` : "";

    if (pitchTone === "analytical") {
      return `Subject: Digital Performance Report for ${bizName} - Local Website Review

Dear Team at ${bizName},

I was auditing local business profiles for ${lead.category} in ${city} and spent some time studying your Google listing. 

Your profile is highly optimized in terms of reviews, holding an ${ratingText}${reviewsText}! However, I noticed that you currently do not have a website linked to your Google Business listing.

Based on industry analytics, up to 56% of potential customers who visit a highly-rated Google Profile will check the linked website to compare pricing, book services, or read your bio before calling. By not having a modern, fast-loading responsive landing page, you are likely losing up to half of your high-intent local mobile traffic to competitors who do have active sites.

I've put together a brief, 3-point digital growth blueprint specifically for ${bizName} including:
- A custom 1-page mobile-friendly site layout
- One-click click-to-call and quick booking integrations
- Core GMB profile completeness enhancements

Would you be open to a quick, 5-minute call this Thursday to see the wireframe draft?

Sincerely,
[Your Name]
[Your Agency Name]
[Contact Number]`;
    }

    if (pitchTone === "urgent") {
      return `Subject: Urgent Website Opportunity for ${bizName} in ${city}

Hi ${bizName} Team,

I'm writing because I was trying to find your services online in ${city}, and noticed something that might be causing you to lose valuable customers.

While you have an ${ratingText}${reviewsText} on Google, there is no website listed for your business. In 2026, over 80% of consumers will search for businesses on their smartphones first, and if they cannot find a professional website to verify details, they will instantly jump back to a competitor who has one.

I specialize in launching high-converting, mobile-friendly landing pages specifically for ${lead.category} services. I can have a beautiful, responsive, SEO-optimized website live for ${bizName} in under a week to ensure you capture every lead in ${city}.

Are you available for a 2-minute conversation tomorrow to discuss this major sales opportunity?

Best regards,
[Your Name]
[Your Agency/Company]
[Phone Number]`;
    }

    // Default: Friendly
    return `Subject: Quick question regarding ${bizName}'s Google listing

Hi ${bizName} Team,

I hope you're having an amazing week! 

My name is [Your Name], and I was looking at local ${lead.category} businesses in ${city} today. I wanted to reach out because you have an ${ratingText}${reviewsText} on Google—which is fantastic! Clearly, your customers love what you do.

I did notice one quick thing: you don't have a website listed on your Google profile. 

Many local businesses don't realize that adding a simple, clean, mobile-optimized website can increase their inbound calls and appointments by 30% to 50% because it gives customers a direct way to view your menu of services, hours, or request quotes instantly.

I design fast, modern websites for businesses in ${city}, and I'd love to build a beautiful page for ${bizName} to help you capitalize on your excellent Google reputation.

If you are interested, I can send over a completely free interactive layout draft we created for you. Let me know what you think!

Warmly,
[Your Name]
[Your Agency Name]
[Your Phone/Email]`;
  };

  const handleCopyPitch = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  // CSV export of search results
  const exportSearchResultsCSV = () => {
    if (filteredPlaces.length === 0) return;
    
    const headers = ["Name", "Phone", "Rating", "Review Count", "Website", "Address", "Category", "Opportunity Score", "Lead Priority", "Profile Completeness"];
    const rows = filteredPlaces.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.phone}"`,
      p.rating,
      p.reviewCount,
      p.website ? `"${p.website}"` : "None",
      `"${p.address.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.opportunityScore,
      p.leadPriority,
      p.profileCompleteness
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NoWebsite_Search_Results_${searchParams.city}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Top SEO Optimized Header & Dark Mode Toggles */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-900/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                No Website Business Finder
              </h1>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
                B2B Lead Acquisition Agency Tool
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer min-h-[40px]"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Connection mode indicator pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
              isLiveMode 
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? "bg-emerald-500" : "bg-amber-500"}`} />
              {isLiveMode ? "Live API" : "Simulated Demo"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Navigation Tabs bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3 mb-6">
          <nav className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("search")}
              className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "search"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Search size={14} />
              Lead Search
            </button>
            <button
              onClick={() => setActiveTab("crm")}
              className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "crm"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Briefcase size={14} />
              Leads CRM
              {savedLeads.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {savedLeads.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("help")}
              className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "help"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <HelpCircle size={14} />
              Connection & scoring
            </button>
          </nav>

          {/* Quick Stats on Pipeline (Desktop) */}
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>CRM Value: <b className="text-emerald-600 dark:text-emerald-400">${savedLeads.reduce((a,c) => a + (c.potentialDealSize || 0), 0).toLocaleString()}</b></span>
            <span>•</span>
            <span>Uncontacted: <b className="text-indigo-600 dark:text-indigo-400">{savedLeads.filter(l=>l.status === 'New').length}</b></span>
          </div>
        </div>

        {/* AdSense Top Leaderboard */}
        <AdUnit slotId="leaderboard-top" format="leaderboard" />

        {/* Content Router */}
        <div className="mt-4">
          
          {/* TAB 1: LEAD SEARCH */}
          {activeTab === "search" && (
            <div className="space-y-6">
              
              {/* Search Criteria Bar */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900/60 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Search Local Businesses
                  </h3>
                </div>

                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSearch(false); }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
                >
                  {/* Category select */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Category</label>
                    <select
                      value={searchParams.category}
                      onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                    >
                      <option value="Dentist">🦷 Dentists</option>
                      <option value="Plumber">🪠 Plumbers</option>
                      <option value="Bakery">🥐 Bakeries</option>
                      <option value="Restaurant">🍕 Restaurants</option>
                      <option value="Roofer">🏠 Roofing Contractors</option>
                      <option value="Hair Salon">💇 Hair Salons</option>
                      <option value="Gym">💪 Gyms & Fitness</option>
                      <option value="Electrician">⚡ Electricians</option>
                      <option value="Landscaper">🌳 Landscapers</option>
                      <option value="Accountant">📊 Accountants</option>
                      <option value="Auto Repair">🚗 Auto Mechanics</option>
                    </select>
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Miami, Boston"
                      value={searchParams.city}
                      onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>

                  {/* State abbreviation */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">State</label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="e.g. FL, MA"
                      value={searchParams.state}
                      onChange={(e) => setSearchParams({ ...searchParams, state: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium uppercase"
                      required
                    />
                  </div>

                  {/* Radius select */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Search Radius</label>
                    <select
                      value={searchParams.radius}
                      onChange={(e) => setSearchParams({ ...searchParams, radius: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                    >
                      <option value={5}>5 Miles</option>
                      <option value={10}>10 Miles</option>
                      <option value={25}>25 Miles</option>
                      <option value={50}>50 Miles</option>
                    </select>
                  </div>

                  {/* Search CTA */}
                  <div className="flex items-end">
                    <button
                      id="search-leads-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="cursor-pointer w-full min-h-[46px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Search size={16} />
                          Search Leads
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Info fallback indicator */}
                {infoMessage && (
                  <div className="mt-4 flex items-start gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl p-3 text-xs text-indigo-700 dark:text-indigo-400">
                    <Info size={15} className="shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{infoMessage}</span>
                  </div>
                )}
              </div>

              {/* Grid content and filters sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Desktop Filters Sidebar */}
                <div className="hidden lg:block space-y-4">
                  <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900/60 rounded-3xl p-5 sticky top-24">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-900">
                      <Filter size={16} className="text-slate-500" />
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Filter Results
                      </h4>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Website toggle */}
                      <div className="flex items-center justify-between">
                        <label htmlFor="filter-website-checkbox" className="font-semibold text-slate-600 dark:text-slate-400">Only No Website</label>
                        <input
                          id="filter-website-checkbox"
                          type="checkbox"
                          checked={filters.onlyNoWebsite}
                          onChange={(e) => setFilters({ ...filters, onlyNoWebsite: e.target.checked })}
                          className="w-4.5 h-4.5 border-slate-300 dark:border-slate-800 accent-indigo-600 rounded-sm cursor-pointer"
                        />
                      </div>

                      {/* inline query search */}
                      <div className="space-y-1">
                        <label htmlFor="filter-name-input" className="font-semibold text-slate-600 dark:text-slate-400 block">Name Search</label>
                        <input
                          id="filter-name-input"
                          type="text"
                          placeholder="Filter by name..."
                          value={filters.searchQuery}
                          onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 p-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      {/* Min Rating */}
                      <div className="space-y-1">
                        <label htmlFor="filter-rating-select" className="font-semibold text-slate-600 dark:text-slate-400 block">Min Rating</label>
                        <select
                          id="filter-rating-select"
                          value={filters.minRating}
                          onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value={0}>Any rating</option>
                          <option value={3.5}>3.5+ stars</option>
                          <option value={4.0}>4.0+ stars</option>
                          <option value={4.5}>4.5+ stars</option>
                        </select>
                      </div>

                      {/* Min Reviews */}
                      <div className="space-y-1">
                        <label htmlFor="filter-reviews-input" className="font-semibold text-slate-600 dark:text-slate-400 block">Min Review Count</label>
                        <input
                          id="filter-reviews-input"
                          type="number"
                          placeholder="e.g. 0"
                          value={filters.minReviews === 0 ? "" : filters.minReviews}
                          onChange={(e) => setFilters({ ...filters, minReviews: Math.max(0, Number(e.target.value)) })}
                          className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      {/* Lead Priority selection */}
                      <div className="space-y-1">
                        <label htmlFor="filter-priority-select" className="font-semibold text-slate-600 dark:text-slate-400 block">Lead Priority</label>
                        <select
                          id="filter-priority-select"
                          value={filters.priority}
                          onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="ALL">All Priorities</option>
                          <option value="HIGH">🔥 High Priority</option>
                          <option value="MEDIUM">⚡ Medium Priority</option>
                          <option value="LOW">❄️ Low Priority</option>
                        </select>
                      </div>

                      {/* Min Opportunity score slider */}
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          <label htmlFor="filter-score-slider">Min Opp. Score</label>
                          <span>{filters.minOpportunityScore}+</span>
                        </div>
                        <input
                          id="filter-score-slider"
                          type="range"
                          min={0}
                          max={100}
                          value={filters.minOpportunityScore}
                          onChange={(e) => setFilters({ ...filters, minOpportunityScore: Number(e.target.value) })}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Sponsored Ad Block */}
                  <AdUnit slotId="sidebar-ad" format="sidebar" />
                </div>

                {/* Mobile Filters Trigger (Visible on small screens) */}
                <div className="lg:hidden flex items-center justify-between gap-3">
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex-1 cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <SlidersHorizontal size={14} />
                    Filters {filters.onlyNoWebsite ? "(No Website)" : ""}
                  </button>

                  <button
                    onClick={exportSearchResultsCSV}
                    disabled={filteredPlaces.length === 0}
                    className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40"
                  >
                    <Download size={14} />
                    Export CSV ({filteredPlaces.length})
                  </button>
                </div>

                {/* Mobile Filters Expandable Panel */}
                <AnimatePresence>
                  {showMobileFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="lg:hidden overflow-hidden bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 space-y-4 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <label htmlFor="mobile-filter-website-checkbox" className="font-semibold text-slate-600 dark:text-slate-400">Only No Website</label>
                        <input
                          id="mobile-filter-website-checkbox"
                          type="checkbox"
                          checked={filters.onlyNoWebsite}
                          onChange={(e) => setFilters({ ...filters, onlyNoWebsite: e.target.checked })}
                          className="w-4.5 h-4.5 border-slate-300 dark:border-slate-800 accent-indigo-600 rounded-sm cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="mobile-filter-name-input" className="font-semibold text-slate-600 dark:text-slate-400 block">Name Search</label>
                        <input
                          id="mobile-filter-name-input"
                          type="text"
                          placeholder="Filter by name..."
                          value={filters.searchQuery}
                          onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label htmlFor="mobile-filter-rating-select" className="font-semibold text-slate-600 dark:text-slate-400 block">Min Rating</label>
                          <select
                            id="mobile-filter-rating-select"
                            value={filters.minRating}
                            onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-700 dark:text-slate-300"
                          >
                            <option value={0}>Any rating</option>
                            <option value={3.5}>3.5+ stars</option>
                            <option value={4.0}>4.0+ stars</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="mobile-filter-priority-select" className="font-semibold text-slate-600 dark:text-slate-400 block">Priority</label>
                          <select
                            id="mobile-filter-priority-select"
                            value={filters.priority}
                            onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-700 dark:text-slate-300"
                          >
                            <option value="ALL">All Priorities</option>
                            <option value="HIGH">🔥 High</option>
                            <option value="MEDIUM">⚡ Medium</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          <label htmlFor="mobile-filter-score-slider">Min Opp. Score ({filters.minOpportunityScore}+)</label>
                        </div>
                        <input
                          id="mobile-filter-score-slider"
                          type="range"
                          min={0}
                          max={100}
                          value={filters.minOpportunityScore}
                          onChange={(e) => setFilters({ ...filters, minOpportunityScore: Number(e.target.value) })}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lead Results Cards List */}
                <div className="lg:col-span-3 space-y-4">
                  
                  {/* Results Count and Export Options (Desktop Only) */}
                  <div className="hidden lg:flex items-center justify-between">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      Found {filteredPlaces.length} leads in {searchParams.city}, {searchParams.state} 
                      {filters.onlyNoWebsite ? " (No Website)" : ""}
                    </p>

                    <button
                      onClick={exportSearchResultsCSV}
                      disabled={filteredPlaces.length === 0}
                      className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-3 flex items-center justify-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 transition-colors"
                    >
                      <Download size={13} />
                      Export CSV ({filteredPlaces.length})
                    </button>
                  </div>

                  {/* Loading overlay / spinner */}
                  {loading ? (
                    <div className="py-24 text-center">
                      <div className="inline-block w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Searching Google Places database...
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                        Formulating local addresses and analyzing profile completeness
                      </span>
                    </div>
                  ) : error ? (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-3xl p-6 text-center space-y-3">
                      <AlertTriangle className="mx-auto text-rose-500" size={32} />
                      <h3 className="font-bold text-rose-800 dark:text-rose-300">Search Failed</h3>
                      <p className="text-xs text-rose-600/90 dark:text-rose-400 max-w-sm mx-auto">
                        {error}
                      </p>
                    </div>
                  ) : filteredPlaces.length === 0 ? (
                    <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl p-12 text-center space-y-3">
                      <Search className="mx-auto text-slate-300 dark:text-slate-700" size={36} />
                      <h3 className="font-bold text-slate-700 dark:text-slate-300">No matching leads found</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                        Try reducing your minimum filters or changing your search criteria (e.g., try another city or clear "Only No Website").
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredPlaces.map(place => (
                        <LeadCard
                          key={place.id}
                          business={place}
                          isSaved={savedLeads.some(l => l.id === place.id)}
                          onToggleSave={handleToggleSave}
                          onViewDetails={(b) => setSelectedLead(b)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Load More Pagination */}
                  {nextPageToken && !loading && (
                    <div className="pt-4 text-center">
                      <button
                        onClick={() => handleSearch(true)}
                        disabled={loadingMore}
                        className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-slate-800 py-3 px-6 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 disabled:opacity-40"
                      >
                        {loadingMore ? (
                          <>
                            <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                            Loading more...
                          </>
                        ) : (
                          <>
                            Load More Businesses
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADS CRM */}
          {activeTab === "crm" && (
            <SavedLeadsCRM
              savedLeads={savedLeads}
              onRemoveLead={handleRemoveLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUpdateLeadNotes={handleUpdateLeadNotes}
              onUpdateDealSize={handleUpdateDealSize}
            />
          )}

          {/* TAB 3: HELP & SCORING DETAILS */}
          {activeTab === "help" && (
            <SettingsPanel isLive={isLiveMode} />
          )}

        </div>

        {/* AdSense Bottom Leaderboard */}
        <AdUnit slotId="leaderboard-bottom" format="leaderboard" />

        {/* SEO Landing text at the bottom */}
        <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500 max-w-4xl mx-auto space-y-4">
          <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
            How No Website Business Finder Drives Local Agency Client Acquisition
          </h3>
          <p className="leading-relaxed">
            Finding high-intent agency clients is all about spotting clear business operational friction. The **No Website Business Finder** uses the **Google Places API** to programmatically discover brick-and-mortar storefronts, family-owned contractors, and local healthcare offices who maintain a solid profile ranking on Google Search but have failed to launch a functional website. This gap is a significant opportunity: businesses with robust ratings but no digital storefront lose an average of 42% in direct inbound phone leads due to client credibility checks.
          </p>
          <p className="leading-relaxed">
            Our proprietary **Opportunity Score** rates lead quality instantly by weighting website status, review counts, and profile metrics. High opportunity leads are flagged so your outreach reps can instantly pitch landing pages, SEO citations, review generation strategies, or local directory optimization. Export your custom leads list directly to Excel or CSV, load them into your CRM, and begin targeted sales outreach with our dynamically pre-loaded pitch email script templates.
          </p>
        </section>

      </main>

      {/* Analysis & Outreach Script Generation Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-900 flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {selectedLead.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 leading-tight">
                    {selectedLead.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} />
                    {selectedLead.address}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Scroll Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-xs sm:text-sm">
                
                {/* 1. Lead Assessment Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Rating / Review count */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-900/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Google Reputation</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="text-amber-500 fill-amber-500" size={15} />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLead.rating || "N/A"}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">({selectedLead.reviewCount} reviews)</span>
                    </div>
                  </div>

                  {/* Profile completeness */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-900/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">GMB Completeness</span>
                    <span className="text-base font-black text-slate-800 dark:text-slate-200 block mt-0.5">{selectedLead.profileCompleteness}%</span>
                  </div>

                  {/* Opportunity Score */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider block">Opportunity Score</span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">{selectedLead.opportunityScore} / 100</span>
                  </div>
                </div>

                {/* 2. Audit Checklist */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
                    <CheckCircle size={15} className="text-indigo-600" />
                    Digital Audit Checklist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* Website */}
                    <div className="flex items-start gap-2">
                      {selectedLead.website ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold block">Website Presence</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {selectedLead.website ? "Has functional website" : "No website link discovered. Immediate web development lead."}
                        </span>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-2">
                      {selectedLead.phone && selectedLead.phone !== "No Phone" ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold block">Phone Number listed</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {selectedLead.phone && selectedLead.phone !== "No Phone" ? "Phone listed" : "No phone number linked. Hard to convert GMB listing."}
                        </span>
                      </div>
                    </div>

                    {/* Review volume */}
                    <div className="flex items-start gap-2">
                      {selectedLead.reviewCount >= 15 ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold block">Review Authority</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {selectedLead.reviewCount >= 15 ? "Healthy review volume" : "Low review volume. Needs automated review campaign."}
                        </span>
                      </div>
                    </div>

                    {/* Average rating */}
                    <div className="flex items-start gap-2">
                      {selectedLead.rating >= 4.0 || selectedLead.rating === 0 ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold block">Rating Health</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {selectedLead.rating >= 4.0 || selectedLead.rating === 0 ? "Satisfied customers" : "Rating below 4.0. Reputation management lead."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Dynamic Outreach Script Template Builder */}
                <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-900 pt-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Mail size={15} className="text-indigo-600" />
                      Dynamic Pitch Writer
                    </h4>

                    {/* Tone Selectors */}
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg text-xs self-start sm:self-auto font-bold">
                      <button
                        onClick={() => setPitchTone("friendly")}
                        className={`cursor-pointer px-2.5 py-1 rounded-md ${pitchTone === "friendly" ? "bg-white dark:bg-slate-800 text-indigo-600" : "text-slate-500"}`}
                      >
                        Friendly
                      </button>
                      <button
                        onClick={() => setPitchTone("analytical")}
                        className={`cursor-pointer px-2.5 py-1 rounded-md ${pitchTone === "analytical" ? "bg-white dark:bg-slate-800 text-indigo-600" : "text-slate-500"}`}
                      >
                        Audited
                      </button>
                      <button
                        onClick={() => setPitchTone("urgent")}
                        className={`cursor-pointer px-2.5 py-1 rounded-md ${pitchTone === "urgent" ? "bg-white dark:bg-slate-800 text-indigo-600" : "text-slate-500"}`}
                      >
                        Urgent
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    Instantly copy this structured, personalized pitch script to email or cold call this business lead. This script automatically injects their business reputation and category!
                  </p>

                  <div className="relative">
                    <pre className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed max-h-[250px]">
                      {generatePitchText(selectedLead)}
                    </pre>

                    <button
                      onClick={() => handleCopyPitch(generatePitchText(selectedLead))}
                      className="absolute right-3.5 top-3.5 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-slate-500 hover:text-indigo-600 flex items-center gap-1 shadow-sm transition-all text-xs font-bold"
                    >
                      <Copy size={13} />
                      {copiedPitch ? "Copied!" : "Copy Pitch"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Modal Footer actions */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/20 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Lead Action Audit Panel
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleToggleSave(selectedLead);
                    }}
                    className={`flex-1 sm:flex-initial cursor-pointer py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                      savedLeads.some(l => l.id === selectedLead.id)
                        ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40 hover:bg-rose-100"
                        : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
                    }`}
                  >
                    {savedLeads.some(l => l.id === selectedLead.id) ? "Remove from CRM" : "Save Lead to CRM"}
                  </button>
                  
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="flex-1 sm:flex-initial cursor-pointer py-2 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
