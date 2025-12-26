/* /config.js
   Central configuration for GeoTourismZim
*/

window.APP_CONFIG = {
  /* =========================
     App
     ========================= */
  appName: "GeoTourismZim",
  currency: "USD",
  country: "Zimbabwe",
  map: {
    center: [-19.0154, 29.1549],
    zoom: 6
  },

  /* =========================
     Features (toggle safely)
     ========================= */
  features: {
    search: true,
    map: true,
    itineraries: true,
    exportPDF: true,
    affiliateDeals: true,
    shop: true,
    consultation: true,
    supplyDemand: true
  },

  /* =========================
     Search configuration
     ========================= */
  search: {
    keys: ["name", "region", "type", "tags", "summary"],
    minChars: 2
  },

  /* =========================
     Affiliate links (replace later)
     ========================= */
  affiliates: {
    hotels: {
      label: "Book Hotels",
      provider: "Booking.com",
      baseUrl: "https://www.booking.com/searchresults.html",
      params: {
        aid: "YOUR_BOOKING_AFFILIATE_ID",
        ss: "" // destination injected dynamically
      }
    },

    tours: {
      label: "Book Tours",
      provider: "GetYourGuide",
      baseUrl: "https://www.getyourguide.com/",
      params: {
        partner_id: "YOUR_GYG_PARTNER_ID"
      }
    },

    flights: {
      label: "Search Flights",
      provider: "Skyscanner",
      baseUrl: "https://www.skyscanner.com/transport/flights/",
      params: {}
    }
  },

  /* =========================
     Shop / Payments
     ========================= */
  shop: {
    enabled: true,
    currency: "USD",

    products: [
      {
        id: "pdf-itinerary",
        name: "Custom Zimbabwe Itinerary (PDF)",
        price: 29,
        description: "Professionally structured itinerary delivered as a printable PDF.",
        paymentLink: "https://buy.stripe.com/REPLACE_ME"
      },
      {
        id: "consult-30",
        name: "30-Minute Travel Consultation",
        price: 49,
        description: "One-on-one planning session for your Zimbabwe trip.",
        paymentLink: "https://buy.stripe.com/REPLACE_ME"
      }
    ]
  },

  /* =========================
     Consultation funnel
     ========================= */
  consultation: {
    enabled: true,
    calendlyUrl: "https://calendly.com/REPLACE_ME",
    emailFallback: "info@geotourismzim.com"
  },

  /* =========================
     Supply & Demand (static v1)
     ========================= */
  supplyDemand: {
    enabled: true,
    note: "Data is indicative and updated periodically."
  },

  /* =========================
     UI copy (easy edits)
     ========================= */
  copy: {
    emptySearch: "No destinations match your search.",
    loading: "Loading…",
    bookNow: "Book Now",
    export: "Export / Save as PDF"
  }
};
