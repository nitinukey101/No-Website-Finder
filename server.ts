import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper state to area codes
const STATE_AREA_CODES: { [key: string]: number[] } = {
  MA: [617, 508, 781, 978],
  NY: [212, 718, 917, 516, 315, 518],
  CA: [213, 310, 415, 650, 408, 510, 619, 858, 949],
  FL: [305, 786, 407, 813, 954, 561, 904],
  TX: [214, 512, 713, 817, 210, 972, 281],
  IL: [312, 773, 847, 630, 815],
  PA: [215, 267, 412, 610, 717],
  OH: [216, 614, 513, 330, 419],
  GA: [404, 770, 678, 912],
  NC: [704, 919, 336, 980],
  MI: [313, 248, 586, 734, 616],
  WA: [206, 425, 253, 509],
  CO: [303, 720, 719, 970],
  AZ: [602, 480, 623, 520],
};

// Opportunity Score calculator for unified business objects
function calculateOpportunityScore(b: {
  website: string | null | undefined;
  reviewCount: number;
  rating: number;
  phone: string | null | undefined;
  address: string | null | undefined;
}) {
  let score = 50; // Base score

  // 1. Website Presence (Most important!)
  if (!b.website) {
    score += 35; // Huge opportunity to build/sell a website
  } else {
    score -= 15; // Low opportunity for core website work
  }

  // 2. Review count (Opportunity for reputation management)
  if (b.reviewCount === 0) {
    score += 15;
  } else if (b.reviewCount < 15) {
    score += 10;
  } else if (b.reviewCount < 50) {
    score += 5;
  }

  // 3. Ratings (Reputation/SEO optimization)
  if (b.rating > 0 && b.rating < 3.8) {
    score += 15;
  } else if (b.rating >= 3.8 && b.rating < 4.4) {
    score += 5;
  }

  // 4. Missing phone (Profile completeness/citations opportunity)
  if (!b.phone || b.phone === "No Phone") {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

function getLeadPriority(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

function calculateProfileCompleteness(b: {
  phone: string | null;
  address: string | null;
  rating: number;
  website: string | null;
}) {
  let score = 20; // Base for existing GMB profile
  if (b.phone && b.phone !== "No Phone") score += 25;
  if (b.address && b.address !== "No Address") score += 25;
  if (b.website) score += 20;
  if (b.rating > 0) score += 10;
  return score;
}

// High-fidelity Mock business generator
function generateMockBusinesses(
  category: string,
  city: string,
  state: string,
  radius: number,
  pageToken?: string
) {
  const normCategory = category.trim().toLowerCase();
  const normCity = city.trim();
  const normState = state.trim().toUpperCase();

  const isPage2 = pageToken === "mock_page_2";

  // List of street names
  const streets = ["Main St", "Oak Ave", "Broadway", "Pine St", "Maple Dr", "Washington Blvd", "2nd Ave", "Elm St", "Cedar Rd", "Park Ln", "Highland Ave", "Spring St", "Market St", "Forest Dr", "Summit Ave"];
  
  // Base adjectives & nouns for business names depending on category
  let adj = ["Apex", "Elite", "Premier", "Summit", "Vibrant", "Cornerstone", "Metro", "Legacy", "Horizon", "Pinnacle", "Beacon", "Harmony", "Precision", "Signature", "Absolute"];
  let nouns = [normCategory];

  if (normCategory.includes("dentist") || normCategory.includes("dental")) {
    adj = ["Bright Smile", "Gentle", "Downtown", "Metro", "Evergreen", "Signature", "CareFirst", "Parkside", "Cosmetic", "Family", "Apex", "Peoples", "Modern", "Advanced", "Radiant"];
    nouns = ["Dental Care", "Dentistry", "Dental Group", "Family Dentist", "Dental Studio"];
  } else if (normCategory.includes("plumb") || normCategory.includes("drain")) {
    adj = ["Rapid", "Express", "Pro", "Emergency", "24/7", "Reliable", "Mainline", "Blue Flow", "Hydro", "Direct", "All-Star", "Pipeline", "Clearwater", "Titan", "Eco-Friendly"];
    nouns = ["Plumbing Services", "Plumbers", "Plumbing & Heating", "Drain Service", "Plumbing Group"];
  } else if (normCategory.includes("bakery") || normCategory.includes("bake") || normCategory.includes("bread")) {
    adj = ["Sweet Treats", "Golden Crust", "Daily Bread", "Artisanal", "The Warm Spoon", "Heavenly", "Sugar & Spice", "Grandma's", "The Rolling Pin", "Flour Power", "Velvet", "Delight"];
    nouns = ["Bakery", "Bake Shop", "Oven", "Pastries & Cakes", "Bread Co."];
  } else if (normCategory.includes("restaurant") || normCategory.includes("food") || normCategory.includes("grill") || normCategory.includes("bistro")) {
    adj = ["Urban", "The Rusty Anchor", "Flavors", "Sizzle", "Golden Fork", "Harvest", "Local", "The Copper Pot", "Rustic", "Wild Pepper", "Blue Ribbon", "Tavern", "Bistro", "Crave"];
    nouns = ["Kitchen", "Grill", "Eatery", "Diner", "Table", "House", "Bistro"];
  } else if (normCategory.includes("roof") || normCategory.includes("construction")) {
    adj = ["Shield", "SureGuard", "Summit", "EverDry", "Lifetime", "All-Weather", "Top Notch", "Ironclad", "WeatherShield", "Pinnacle", "Apex", "Sturdy", "Solid", "Craftsman"];
    nouns = ["Roofing", "Roofing Specialists", "Roof & Siding", "Contractors", "Roofing Group"];
  } else if (normCategory.includes("salon") || normCategory.includes("hair") || normCategory.includes("beauty")) {
    adj = ["Glow", "Chic", "Tress", "Velvet", "Shear Perfection", "Sleek", "Studio 360", "Divine", "Elegance", "Bella", "Vogue", "Silk & Scissors", "Urban Edge", "Aura", "Radiance"];
    nouns = ["Hair Salon", "Beauty Bar", "Studio", "Salon & Spa", "Coiffure"];
  } else if (normCategory.includes("gym") || normCategory.includes("fitness") || normCategory.includes("workout")) {
    adj = ["Iron", "Pulse", "Vigor", "Peak Performance", "Titanium", "Core", "Catalyst", "Fuel", "PowerHouse", "Endurance", "Impact", "Summit", "Flex", "Velocity", "Grit"];
    nouns = ["Fitness", "Gym", "Athletics", "Training Center", "Club"];
  }

  // Get state area codes
  const areaCodes = STATE_AREA_CODES[normState] || [555];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];

  const totalResults = 15;
  const mockList = [];

  for (let i = 0; i < totalResults; i++) {
    // Staggered index if page 2
    const idx = isPage2 ? i + 15 : i;

    // Deterministic random generation based on index and parameters so it stays consistent for the same query
    const seed = (normCategory.length + normCity.length + normState.length + idx) * 17;
    const rand = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const nameAdj = adj[Math.floor(rand(seed) * adj.length)];
    const nameNoun = nouns[Math.floor(rand(seed + 1) * nouns.length)];
    
    // Sometimes prefix with city name for high realism
    let name = "";
    if (rand(seed + 2) > 0.6) {
      name = `${normCity} ${nameAdj} ${nameNoun}`;
    } else {
      name = `${nameAdj} ${nameNoun}`;
    }

    // Capitalize first letters of name
    name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

    // Website presence: 50% don't have websites
    const hasWebsite = rand(seed + 3) > 0.5;
    const website = hasWebsite 
      ? `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` 
      : null;

    // Phone number
    const hasPhone = rand(seed + 4) > 0.08; // 8% missing phone
    const phone = hasPhone
      ? `(${areaCode}) 555-${String(Math.floor(1000 + rand(seed + 5) * 9000))}`
      : "No Phone";

    // Ratings & Reviews
    const hasReviews = rand(seed + 6) > 0.15; // 15% have 0 reviews
    const reviewCount = hasReviews ? Math.floor(rand(seed + 7) * 180) : 0;
    const rating = reviewCount > 0 ? Number((3.0 + rand(seed + 8) * 2.0).toFixed(1)) : 0;

    // Address
    const streetNo = Math.floor(10 + rand(seed + 9) * 1990);
    const streetName = streets[Math.floor(rand(seed + 10) * streets.length)];
    const address = `${streetNo} ${streetName}, ${normCity}, ${normState}`;

    // Category display
    const finalCategory = normCategory.charAt(0).toUpperCase() + normCategory.slice(1);

    // Score Calculations
    const score = calculateOpportunityScore({ website, reviewCount, rating, phone, address });
    const priority = getLeadPriority(score);
    const profileCompleteness = calculateProfileCompleteness({ phone, address, rating, website });

    mockList.push({
      id: `mock_place_${idx}_${normCity.toLowerCase().replace(/[^a-z]/g, "")}`,
      name,
      phone,
      rating,
      reviewCount,
      website,
      address,
      category: finalCategory,
      opportunityScore: score,
      leadPriority: priority,
      profileCompleteness,
      missingWebsite: !website,
      missingPhone: !phone || phone === "No Phone",
      lowReviews: reviewCount < 10,
      lowRating: rating > 0 && rating < 3.8,
    });
  }

  // Sort: show missing websites first (highest opportunity score first)
  mockList.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return {
    places: mockList,
    nextPageToken: isPage2 ? null : "mock_page_2",
  };
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.GOOGLE_MAPS_PLATFORM_KEY ? "live" : "demo" });
});

app.post("/api/search", async (req, res) => {
  try {
    const { category, city, state, radius, pageToken } = req.body;

    if (!category || !city || !state) {
      return res.status(400).json({ error: "Missing required fields (category, city, state)" });
    }

    const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;

    // If API Key is configured, attempt Live Google Places API Search
    if (apiKey && apiKey !== "YOUR_API_KEY" && apiKey !== "") {
      try {
        const textQuery = `${category} in ${city}, ${state}`;
        const requestBody: any = {
          textQuery,
          pageSize: 20,
        };

        if (pageToken) {
          requestBody.pageToken = pageToken;
        }

        const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.primaryType,places.types,nextPageToken",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Google API responded with error:", errorText);
          throw new Error(`Google API responded with status ${response.status}`);
        }

        const data: any = await response.json();
        
        if (!data.places || data.places.length === 0) {
          return res.json({
            places: [],
            nextPageToken: null,
            warning: "No live results found for this area. Try refining your search query.",
          });
        }

        const mappedPlaces = data.places.map((place: any) => {
          const name = place.displayName?.text || "Unknown Business";
          const phone = place.nationalPhoneNumber || "No Phone";
          const rating = place.rating || 0;
          const reviewCount = place.userRatingCount || 0;
          const website = place.websiteUri || null;
          const address = place.formattedAddress || "No Address";
          const primaryTypeNorm = place.primaryType 
            ? place.primaryType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
            : category;

          const score = calculateOpportunityScore({ website, reviewCount, rating, phone, address });
          const priority = getLeadPriority(score);
          const completeness = calculateProfileCompleteness({ phone, address, rating, website });

          return {
            id: place.id,
            name,
            phone,
            rating,
            reviewCount,
            website,
            address,
            category: primaryTypeNorm,
            opportunityScore: score,
            leadPriority: priority,
            profileCompleteness: completeness,
            missingWebsite: !website,
            missingPhone: !phone || phone === "No Phone",
            lowReviews: reviewCount < 10,
            lowRating: rating > 0 && rating < 3.8,
          };
        });

        // Sort by opportunity score desc
        mappedPlaces.sort((a: any, b: any) => b.opportunityScore - a.opportunityScore);

        return res.json({
          places: mappedPlaces,
          nextPageToken: data.nextPageToken || null,
          isLive: true,
        });
      } catch (liveError) {
        console.error("Falling back to simulated data due to live search error:", liveError);
        // Fallback to high fidelity mock data on error so user stays unblocked
        const mockData = generateMockBusinesses(category, city, state, Number(radius || 10), pageToken);
        return res.json({
          ...mockData,
          isLive: false,
          fallbackReason: "Live API request failed. Using high-fidelity local simulation.",
        });
      }
    } else {
      // No API key configured -> Serve polished high-fidelity demo data
      const mockData = generateMockBusinesses(category, city, state, Number(radius || 10), pageToken);
      return res.json({
        ...mockData,
        isLive: false,
      });
    }
  } catch (error: any) {
    console.error("Server API Search general error:", error);
    res.status(500).json({ error: error.message || "An unexpected server error occurred" });
  }
});

// Vite Middleware for client bundling in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`No Website Business Finder server running on port ${PORT}`);
  });
}

startServer();
