export interface Business {
  id: string;
  name: string;
  phone: string;
  rating: number;
  reviewCount: number;
  website: string | null;
  address: string;
  category: string;
  opportunityScore: number;
  leadPriority: "HIGH" | "MEDIUM" | "LOW";
  profileCompleteness: number; // percentage (0 - 100)
  missingWebsite: boolean;
  missingPhone: boolean;
  lowReviews: boolean;
  lowRating: boolean;
}

export interface SavedLead extends Business {
  savedAt: string;
  status: "New" | "Contacted" | "Follow-up" | "Replied" | "Closed";
  notes: string;
  assignedTo?: string;
  potentialDealSize?: number;
}

export interface SearchParams {
  category: string;
  city: string;
  state: string;
  radius: number;
}

export interface SearchFilters {
  onlyNoWebsite: boolean;
  minRating: number;
  minReviews: number;
  minOpportunityScore: number;
  priority: "ALL" | "HIGH" | "MEDIUM" | "LOW";
  searchQuery: string; // inline filter for result names
}
