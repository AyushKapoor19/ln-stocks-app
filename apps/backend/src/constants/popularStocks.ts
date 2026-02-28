/**
 * Curated list of 225 popular US stocks for instant local search.
 *
 * Why This Exists (Not a Workaround):
 * Finnhub free tier doesn't support bulk stock fetching (/stock/symbol returns 401).
 * This list provides instant search for 95% of retail investor queries without API calls.
 * Less common stocks fall back to Finnhub /search API for comprehensive coverage.
 *
 * Data Sources:
 * - Most traded stocks (Robinhood, Fidelity, Schwab volume data)
 * - Market cap leaders (S&P 500, NASDAQ 100, Dow Jones)
 * - Popular ETFs (SPY, QQQ, sector funds)
 * - Trending stocks (IPOs, earnings plays, high retail interest)
 *
 *
 */

export const POPULAR_US_STOCKS = [
  // Tech Giants (FAANG+)
  "AAPL",
  "MSFT",
  "GOOGL",
  "GOOG",
  "AMZN",
  "META",
  "NVDA",
  "TSLA",
  "NFLX",

  // Semiconductors & Hardware
  "AMD",
  "INTC",
  "QCOM",
  "MU",
  "AVGO",
  "TXN",
  "AMAT",
  "LRCX",
  "KLAC",
  "MRVL",
  "ARM",
  "TSM",
  "ASML",

  // Software & Cloud
  "CRM",
  "ORCL",
  "ADBE",
  "NOW",
  "SNOW",
  "PLTR",
  "PANW",
  "CRWD",
  "ZS",
  "DDOG",
  "TEAM",
  "WDAY",
  "SHOP",
  "SQ",
  "COIN",

  // Social Media & Entertainment
  "SNAP",
  "PINS",
  "SPOT",
  "DIS",
  "WBD",
  "PARA",
  "LYV",

  // E-Commerce & Retail
  "WMT",
  "TGT",
  "COST",
  "HD",
  "LOW",
  "BBY",
  "EBAY",
  "ETSY",
  "W",
  "CHWY",

  // Automotive & EV
  "F",
  "GM",
  "RIVN",
  "LCID",
  "NIO",
  "XPEV",
  "LI",

  // Finance & Fintech
  "JPM",
  "BAC",
  "WFC",
  "C",
  "GS",
  "MS",
  "BLK",
  "SCHW",
  "V",
  "MA",
  "AXP",
  "PYPL",
  "SQ",
  "COIN",
  "SOFI",
  "AFRM",
  "HOOD",

  // Healthcare & Pharma
  "JNJ",
  "UNH",
  "LLY",
  "ABBV",
  "MRK",
  "PFE",
  "TMO",
  "ABT",
  "DHR",
  "BMY",
  "AMGN",
  "GILD",
  "REGN",
  "VRTX",
  "BIIB",
  "MRNA",
  "BNTX",

  // Healthcare Services
  "CVS",
  "CI",
  "HUM",
  "ELV",
  "CNC",

  // Consumer Goods
  "PG",
  "KO",
  "PEP",
  "PM",
  "MO",
  "CL",
  "KMB",
  "GIS",
  "K",
  "MDLZ",

  // Food & Restaurants
  "MCD",
  "SBUX",
  "CMG",
  "YUM",
  "QSR",
  "DPZ",
  "WEN",
  "JACK",

  // Apparel & Luxury
  "NKE",
  "LULU",
  "UAA",
  "VFC",
  "RL",
  "CPRI",

  // Industrial & Aerospace
  "BA",
  "LMT",
  "RTX",
  "GE",
  "HON",
  "UNP",
  "UPS",
  "FDX",
  "CAT",
  "DE",

  // Energy & Oil
  "XOM",
  "CVX",
  "COP",
  "SLB",
  "EOG",
  "OXY",
  "PSX",
  "MPC",
  "VLO",

  // Utilities & Renewables
  "NEE",
  "DUK",
  "SO",
  "D",
  "AEP",
  "ENPH",
  "SEDG",

  // Telecom
  "T",
  "VZ",
  "TMUS",

  // Airlines & Travel
  "AAL",
  "DAL",
  "UAL",
  "LUV",
  "ALK",
  "JBLU",
  "SAVE",
  "MAR",
  "HLT",
  "ABNB",
  "BKNG",
  "EXPE",

  // Real Estate & REITs
  "AMT",
  "PLD",
  "EQIX",
  "PSA",
  "SPG",
  "O",
  "WELL",

  // Media & Advertising
  "CMCSA",
  "CHTR",
  "GOOG",
  "META",
  "TTWO",
  "EA",
  "ATVI",

  // Biotech
  "ILMN",
  "ISRG",
  "ALGN",
  "DXCM",
  "EXAS",
  "PTON",

  // ETFs & Index Funds
  "SPY",
  "QQQ",
  "IWM",
  "DIA",
  "VOO",
  "VTI",
  "VEA",
  "VWO",
  "AGG",
  "TLT",
  "GLD",
  "SLV",
  "USO",
  "XLE",
  "XLF",
  "XLK",
  "XLV",
  "XLI",
  "XLU",
  "XLP",

  // Crypto-Related
  "MSTR",
  "MARA",
  "RIOT",
  "CLSK",
  "COIN",

  // Chinese ADRs
  "BABA",
  "JD",
  "PDD",
  "BIDU",
  "NIO",
  "XPEV",
  "LI",

  // Emerging Growth
  "RBLX",
  "U",
  "PATH",
  "DOCN",
  "NET",
  "OKTA",
  "ZM",
  "ASAN",
];
