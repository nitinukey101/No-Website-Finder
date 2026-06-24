import React, { useState } from "react";
import { 
  Briefcase, 
  Trash2, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Phone, 
  Globe, 
  Save, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  X,
  Plus,
  AlertCircle
} from "lucide-react";
import { SavedLead } from "../types";

interface SavedLeadsCRMProps {
  savedLeads: SavedLead[];
  onRemoveLead: (id: string) => void;
  onUpdateLeadStatus: (id: string, status: SavedLead["status"]) => void;
  onUpdateLeadNotes: (id: string, notes: string) => void;
  onUpdateDealSize: (id: string, size: number) => void;
}

export default function SavedLeadsCRM({
  savedLeads,
  onRemoveLead,
  onUpdateLeadStatus,
  onUpdateLeadNotes,
  onUpdateDealSize
}: SavedLeadsCRMProps) {
  const [filterStatus, setFilterStatus] = useState<SavedLead["status"] | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
  const [tempSize, setTempSize] = useState("");

  const statuses: SavedLead["status"][] = ["New", "Contacted", "Follow-up", "Replied", "Closed"];

  // Filter leads
  const filteredLeads = savedLeads.filter(lead => {
    const matchesStatus = filterStatus === "ALL" || lead.status === filterStatus;
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lead.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate quick metrics
  const totalPipelineValue = savedLeads.reduce((acc, lead) => acc + (lead.potentialDealSize || 0), 0);
  const activeLeadsCount = savedLeads.filter(l => l.status !== "Closed").length;

  // Status-based colors
  const statusColors = {
    "New": "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40",
    "Contacted": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/40",
    "Follow-up": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/40",
    "Replied": "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900/40",
    "Closed": "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  };

  // CSV Export
  const exportToCSV = () => {
    if (savedLeads.length === 0) return;
    
    // Headers
    const headers = [
      "Business Name",
      "Phone",
      "Rating",
      "Review Count",
      "Website",
      "Address",
      "Category",
      "Opportunity Score",
      "Lead Priority",
      "CRM Status",
      "Potential Deal Size ($)",
      "Follow-up Notes",
      "Saved At"
    ];

    const rows = savedLeads.map(l => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      l.rating,
      l.reviewCount,
      l.website ? `"${l.website}"` : "None",
      `"${l.address.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      l.opportunityScore,
      l.leadPriority,
      l.status,
      l.potentialDealSize || 0,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      l.savedAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NoWebsite_CRM_Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export (Slick XML format)
  const exportToExcel = () => {
    if (savedLeads.length === 0) return;

    // Excel HTML XML format allows styling and standard parsing
    let xml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Leads Export</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          th { background-color: #4F46E5; color: white; font-weight: bold; border: 1px solid #D1D5DB; padding: 6px; }
          td { border: 1px solid #D1D5DB; padding: 6px; font-family: sans-serif; font-size: 10pt; }
          .high-priority { background-color: #FEE2E2; color: #991B1B; font-weight: bold; }
          .no-website { background-color: #FEF2F2; color: #B91C1C; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Phone</th>
              <th>Rating</th>
              <th>Reviews</th>
              <th>Website Status</th>
              <th>Address</th>
              <th>Category</th>
              <th>Opportunity Score</th>
              <th>Lead Priority</th>
              <th>CRM Status</th>
              <th>Est. Deal Size ($)</th>
              <th>Saved Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
    `;

    savedLeads.forEach(l => {
      xml += `
        <tr>
          <td><b>${l.name}</b></td>
          <td>${l.phone}</td>
          <td>${l.rating || "N/A"}</td>
          <td>${l.reviewCount}</td>
          <td class="${!l.website ? "no-website" : ""}">${l.website || "No Website"}</td>
          <td>${l.address}</td>
          <td>${l.category}</td>
          <td align="center">${l.opportunityScore}</td>
          <td class="${l.leadPriority === "HIGH" ? "high-priority" : ""}">${l.leadPriority}</td>
          <td>${l.status}</td>
          <td>$${l.potentialDealSize || 0}</td>
          <td>${new Date(l.savedAt).toLocaleDateString()}</td>
          <td>${l.notes || ""}</td>
        </tr>
      `;
    });

    xml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NoWebsite_CRM_Leads_Export_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNotesEditStart = (id: string, notes: string) => {
    setEditingNotesId(id);
    setTempNotes(notes);
  };

  const handleNotesSave = (id: string) => {
    onUpdateLeadNotes(id, tempNotes);
    setEditingNotesId(null);
  };

  const handleSizeEditStart = (id: string, currentSize: number = 0) => {
    setEditingSizeId(id);
    setTempSize(currentSize === 0 ? "" : String(currentSize));
  };

  const handleSizeSave = (id: string) => {
    const sizeNum = Number(tempSize);
    onUpdateDealSize(id, isNaN(sizeNum) ? 0 : sizeNum);
    setEditingSizeId(null);
  };

  return (
    <div id="leads-crm-view" className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900/60 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Saved Pipeline</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">${totalPipelineValue.toLocaleString()}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">Est. Value</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900/60 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Leads</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{activeLeadsCount}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">/ {savedLeads.length} total</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900/60 p-4 rounded-2xl flex flex-col justify-between col-span-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">CRM Data Utility</span>
          <div className="flex gap-2 mt-3">
            <button
              onClick={exportToCSV}
              disabled={savedLeads.length === 0}
              className="flex-1 cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={14} />
              CSV Export
            </button>
            <button
              onClick={exportToExcel}
              disabled={savedLeads.length === 0}
              className="flex-1 cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FileSpreadsheet size={14} />
              Excel Export
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Filter Tabs (Horizontal Scrollable for Mobile) */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none shrink-0">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
              filterStatus === "ALL"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            All ({savedLeads.length})
          </button>
          {statuses.map(st => {
            const count = savedLeads.filter(l => l.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                  filterStatus === st
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>

        {/* Inline Search in CRM */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search saved leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Saved Leads Pipeline Lists */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl p-6">
          <AlertCircle className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={36} />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No leads found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {savedLeads.length === 0 
              ? "Your pipeline is empty! Search for local businesses and click the bookmark button to save them here." 
              : "No leads matched your filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map(lead => {
            const isExpanded = expandedLeadId === lead.id;
            
            return (
              <div
                id={`crm-lead-${lead.id}`}
                key={lead.id}
                className={`bg-white dark:bg-slate-950 border rounded-2xl transition-all duration-200 ${
                  isExpanded 
                    ? "border-indigo-400/80 dark:border-indigo-900/60 shadow-lg shadow-indigo-600/[0.02]" 
                    : "border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800"
                }`}
              >
                {/* Expandable Header block */}
                <div 
                  onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm sm:text-base">
                        {lead.name}
                      </h4>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                        {lead.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        Score: 
                        <b className={lead.opportunityScore >= 75 ? "text-rose-500" : "text-amber-500"}>
                          {lead.opportunityScore}
                        </b>
                      </span>
                      <span>•</span>
                      <span>{lead.address.split(",")[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider leading-none ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                    
                    {/* Expand Chevron */}
                    <div className="text-slate-400 dark:text-slate-600">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-900/60 space-y-4 text-xs">
                    {/* Lead Quick Contact Row */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 py-1 text-slate-600 dark:text-slate-400">
                      {lead.phone && lead.phone !== "No Phone" && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                          <Phone size={13} />
                          {lead.phone}
                        </a>
                      )}
                      
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline">
                          <Globe size={13} />
                          Visit Website
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                          <X size={13} />
                          No Website
                        </span>
                      )}
                    </div>

                    {/* Pipelines Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-900/40">
                      {/* Update status */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Status</label>
                        <select
                          value={lead.status}
                          onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as SavedLead["status"])}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-hidden font-medium"
                        >
                          {statuses.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      {/* Potential Deal value */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Est. Deal Value ($)</label>
                        {editingSizeId === lead.id ? (
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              value={tempSize}
                              onChange={(e) => setTempSize(e.target.value)}
                              placeholder="0"
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSizeSave(lead.id)}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shrink-0 cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-lg px-2.5 py-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              ${(lead.potentialDealSize || 0).toLocaleString()}
                            </span>
                            <button
                              onClick={() => handleSizeEditStart(lead.id, lead.potentialDealSize)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Saved Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Lead Saved On</label>
                        <div className="px-2.5 py-1.5 border border-transparent font-medium text-slate-500 dark:text-slate-400">
                          {new Date(lead.savedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      </div>
                    </div>

                    {/* Follow-up Notes area */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Follow-up Notes / Tasks</label>
                        {editingNotesId !== lead.id && (
                          <button
                            onClick={() => handleNotesEditStart(lead.id, lead.notes)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                          >
                            <Edit3 size={11} />
                            Edit notes
                          </button>
                        )}
                      </div>

                      {editingNotesId === lead.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="Add your agency pitch notes, client objections, scheduled calls..."
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 min-h-[70px] focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleNotesSave(lead.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Save size={12} />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900/30 text-slate-700 dark:text-slate-300 min-h-[40px] italic">
                          {lead.notes ? lead.notes : "No notes yet. Add follow-up logs to track your outreach."}
                        </div>
                      )}
                    </div>

                    {/* Actions bar */}
                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-900/30">
                      <button
                        onClick={() => onRemoveLead(lead.id)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 py-1.5 px-3 rounded-xl flex items-center gap-1 font-bold transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        Remove Lead
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
