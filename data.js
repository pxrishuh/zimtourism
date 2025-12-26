/* /data.js
   GeoTourismZim — Zimbabwe Master Destination Dataset
   Used by: /app.js (site) and /editor.js (CMS editor)

   MAP RULE:
   Only destinations with valid numeric lat/lng appear on the map.
*/

window.DESTINATIONS = [

/* =========================
   ICONIC & WORLD HERITAGE
   ========================= */
{
  id: "victoria-falls",
  name: "Victoria Falls (Mosi-oa-Tunya)",
  region: "Matabeleland North",
  type: "Nature",
  lat: -17.9243,
  lng: 25.8572,
  bestTime: "Apr–Oct",
  estimatedBudget: "$$–$$$",
  stayHint: "Victoria Falls Town",
  summary: "One of the Seven Natural Wonders of the World, offering rainforest viewpoints, adventure activities, and river cruises.",
  tags: ["UNESCO", "Iconic", "Waterfall"],
  highlights: ["Falls viewpoints", "Zambezi cruises", "Adventure sports"],
  heroImage: "assets/images/destinations/victoria-falls.jpg",
  gallery: []
},
{
  id: "great-zimbabwe",
  name: "Great Zimbabwe National Monument",
  region: "Masvingo",
  type: "Heritage",
  lat: -20.2684,
  lng: 30.9337,
  bestTime: "Apr–Oct",
  estimatedBudget: "$–$$",
  stayHint: "Masvingo",
  summary: "Southern Africa’s largest stone ruins and a defining symbol of Zimbabwean civilisation.",
  tags: ["UNESCO", "History", "Culture"],
  highlights: ["Great Enclosure", "Hill Complex", "Stone architecture"],
  heroImage: "assets/images/destinations/great-zimbabwe.jpg",
  gallery: []
},
{
  id: "matobo-hills",
  name: "Matobo Hills",
  region: "Matabeleland South",
  type: "Heritage",
  lat: -20.5,
  lng: 28.5,
  bestTime: "Apr–Oct",
  estimatedBudget: "$–$$",
  stayHint: "Bulawayo",
  summary: "Granite kopjes, rock art, and spiritual landscapes near Bulawayo.",
  tags: ["UNESCO", "Rock Art", "Landscape"],
  highlights: ["Rock art sites", "Rhino tracking", "Scenic viewpoints"],
  heroImage: "assets/images/destinations/matobo.jpg",
  gallery: []
},

/* =========================
   NATIONAL PARKS & SAFARI
   ========================= */
{
  id: "hwange-national-park",
  name: "Hwange National Park",
  region: "Matabeleland North",
  type: "Safari",
  lat: -18.6294,
  lng: 26.946,
  bestTime: "May–Oct",
  estimatedBudget: "$$–$$$$",
  stayHint: "Main Camp / Robins",
  summary: "Zimbabwe’s largest national park, famous for elephants and waterhole game viewing.",
  tags: ["Safari", "Wildlife", "Elephants"],
  highlights: ["Game drives", "Waterhole viewing"],
  heroImage: "assets/images/destinations/hwange.jpg",
  gallery: []
},
{
  id: "mana-pools-national-park",
  name: "Mana Pools National Park",
  region: "Mashonaland West",
  type: "Safari",
  lat: -15.7619,
  lng: 29.372,
  bestTime: "Jun–Oct",
  estimatedBudget: "$$$–$$$$",
  stayHint: "Nyamepi / river camps",
  summary: "UNESCO-listed Zambezi floodplain known for walking and canoe safaris.",
  tags: ["UNESCO", "Walking Safari", "Wilderness"],
  highlights: ["Canoe safaris", "Walking safaris"],
  heroImage: "assets/images/destinations/mana-pools.jpg",
  gallery: []
},
{
  id: "gonarezhou-national-park",
  name: "Gonarezhou National Park",
  region: "South East Lowveld",
  type: "Safari",
  lat: -21.245,
  lng: 31.61,
  bestTime: "May–Oct",
  estimatedBudget: "$$$",
  stayHint: "Chiredzi",
  summary: "Remote wilderness park famous for Chilojo Cliffs and low visitor density.",
  tags: ["Remote", "Safari"],
  highlights: ["Chilojo Cliffs", "Elephants"],
  heroImage: "assets/images/destinations/gonarezhou.jpg",
  gallery: []
},
{
  id: "zambezi-national-park",
  name: "Zambezi National Park",
  region: "Matabeleland North",
  type: "Safari",
  lat: -17.91,
  lng: 25.84,
  bestTime: "May–Oct",
  estimatedBudget: "$$",
  stayHint: "Victoria Falls",
  summary: "A convenient safari park near Victoria Falls along the Zambezi River.",
  tags: ["Safari", "River"],
  highlights: ["Game drives", "River habitats"],
  heroImage: "assets/images/destinations/zambezi-np.jpg",
  gallery: []
},

/* =========================
   LAKES & WATER
   ========================= */
{
  id: "lake-kariba",
  name: "Lake Kariba",
  region: "Lake Kariba",
  type: "Lake",
  lat: -16.523,
  lng: 28.802,
  bestTime: "May–Oct",
  estimatedBudget: "$$",
  stayHint: "Kariba",
  summary: "One of the world’s largest man-made lakes, famous for houseboats and fishing.",
  tags: ["Houseboats", "Fishing"],
  highlights: ["Sunset cruises", "Tiger fishing"],
  heroImage: "assets/images/destinations/kariba.jpg",
  gallery: []
},
{
  id: "matusadona-national-park",
  name: "Matusadona National Park",
  region: "Lake Kariba",
  type: "Safari",
  lat: -16.844,
  lng: 28.675,
  bestTime: "May–Oct",
  estimatedBudget: "$$$",
  stayHint: "Kariba",
  summary: "Lakefront safari park with escarpment scenery and shoreline wildlife.",
  tags: ["Safari", "Lake"],
  highlights: ["Shoreline wildlife", "Scenic views"],
  heroImage: "assets/images/destinations/matusadona.jpg",
  gallery: []
},

/* =========================
   EASTERN HIGHLANDS
   ========================= */
{
  id: "nyanga-national-park",
  name: "Nyanga National Park",
  region: "Eastern Highlands",
  type: "Mountain",
  lat: -18.213,
  lng: 32.748,
  bestTime: "Apr–Oct",
  estimatedBudget: "$$",
  stayHint: "Nyanga",
  summary: "Zimbabwe’s highest mountains, waterfalls, and cool climate.",
  tags: ["Hiking", "Waterfalls"],
  highlights: ["Mount Nyangani", "Mutarazi Falls"],
  heroImage: "assets/images/destinations/nyanga.jpg",
  gallery: []
},
{
  id: "chimanimani-national-park",
  name: "Chimanimani National Park",
  region: "Eastern Highlands",
  type: "Mountain",
  lat: -19.806,
  lng: 32.861,
  bestTime: "Apr–Oct",
  estimatedBudget: "$$",
  stayHint: "Chimanimani",
  summary: "Rugged alpine landscapes and serious hiking routes.",
  tags: ["Trekking", "Adventure"],
  highlights: ["Mountain ridges", "Remote trails"],
  heroImage: "assets/images/destinations/chimanimani.jpg",
  gallery: []
},
{
  id: "vumba-mountains",
  name: "Vumba Mountains",
  region: "Eastern Highlands",
  type: "Mountain",
  lat: -19.105,
  lng: 32.682,
  bestTime: "Year-round",
  estimatedBudget: "$$",
  stayHint: "Mutare",
  summary: "Misty forests and viewpoints overlooking Mozambique.",
  tags: ["Scenic", "Forest"],
  highlights: ["Viewpoints", "Botanical gardens"],
  heroImage: "assets/images/destinations/vumba.jpg",
  gallery: []
},

/* =========================
   CITIES & BASES
   ========================= */
{
  id: "harare",
  name: "Harare",
  region: "Mashonaland",
  type: "City",
  lat: -17.825,
  lng: 31.033,
  bestTime: "Year-round",
  estimatedBudget: "$",
  stayHint: "Harare",
  summary: "Zimbabwe’s capital and main international gateway.",
  tags: ["City", "Gateway"],
  highlights: ["Markets", "Galleries"],
  heroImage: "assets/images/destinations/harare.jpg",
  gallery: []
},
{
  id: "bulawayo",
  name: "Bulawayo",
  region: "Matabeleland",
  type: "City",
  lat: -20.156,
  lng: 28.59,
  bestTime: "Year-round",
  estimatedBudget: "$",
  stayHint: "Bulawayo",
  summary: "Historic second city and base for Matobo and Khami.",
  tags: ["Heritage", "Base Town"],
  highlights: ["Museums", "Architecture"],
  heroImage: "assets/images/destinations/bulawayo.jpg",
  gallery: []
},

/* =========================
   DAY TRIPS & NICHE
   ========================= */
{
  id: "chinhoyi-caves",
  name: "Chinhoyi Caves",
  region: "Mashonaland West",
  type: "Adventure",
  lat: -17.362,
  lng: 30.179,
  bestTime: "Year-round",
  estimatedBudget: "$",
  stayHint: "Chinhoyi",
  summary: "Limestone caves with striking blue pools.",
  tags: ["Caves", "Day Trip"],
  highlights: ["Cave viewpoints"],
  heroImage: "assets/images/destinations/chinhoyi.jpg",
  gallery: []
}

];
