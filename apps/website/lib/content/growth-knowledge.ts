/** Original editorial guidance, not third-party articles or fabricated client results. */
export type GrowthGuide = {
  slug: string;
  title: string;
  description: string;
  category: "Technical SEO" | "Local discovery" | "Analytics" | "AI search";
  audience: string;
  readMinutes: number;
  sections: { heading: string; paragraphs: string[]; actions?: string[] }[];
};

export const GROWTH_GUIDES: GrowthGuide[] = [
  {
    slug: "website-seo-checklist-small-business",
    title: "A practical website SEO checklist for small businesses",
    description: "Check discoverability, useful content, mobile usability and the path from search to enquiry before buying expensive SEO tools.",
    category: "Technical SEO",
    audience: "Business owners",
    readMinutes: 5,
    sections: [
      { heading: "Start with the customer journey", paragraphs: [
        "An SEO audit should answer two separate questions: can search engines access your useful pages, and can the right visitor become a customer? A technically valid page is not necessarily commercially useful.",
        "List the services customers actually search for, and match each major intent to a clear public landing page. Give each page an accurate title, one descriptive main heading, useful text, and an unmistakable enquiry or booking action."
      ], actions: ["Check each important page in a mobile browser.", "Confirm contact, booking and WhatsApp links work.", "Record what happens after a customer submits an enquiry."] },
      { heading: "Check the essentials, not an invented score", paragraphs: [
        "Verify that the intended canonical URL loads, is indexable, and is linked internally. Review your sitemap, robots instructions, redirect chains, broken links, descriptive images and relevant structured data. These checks identify problems; they do not predict a Google ranking.",
        "Use Search Console for evidence about queries, clicks and indexing. Use page-performance diagnostics to spot slow or unstable experiences. A score of 90 from a third-party checker is not a revenue metric."
      ], actions: ["Confirm the preferred https URL and canonical tags.", "Inspect Search Console indexing for priority pages.", "Fix genuine errors before writing more articles."] },
      { heading: "Measure the outcome", paragraphs: [
        "Create a baseline of non-branded search clicks, qualified enquiries and successful bookings or orders. Keep organic search attribution separate from paid advertising and direct traffic. Reassess after meaningful changes, allowing time for search engines to recrawl."
      ] }
    ]
  },
  {
    slug: "google-business-profile-local-enquiries",
    title: "Turn Google Business Profile visibility into local enquiries",
    description: "A local-search operating guide for service businesses, shops, salons and bakeries.",
    category: "Local discovery",
    audience: "Local businesses",
    readMinutes: 5,
    sections: [
      { heading: "Make the listing useful and accurate", paragraphs: [
        "A business profile should reflect the real business: correct name, eligible address or service area, category, contact information, opening hours and relevant services. Keep information consistent with the website and on-the-ground operation.",
        "Photographs of the real premises, team and products help visitors make a decision. Do not invent branches, reviews, location keywords in the business name, or claims about availability."
      ], actions: ["Review the primary category and business hours.", "Check calls, directions and the appointment/order link.", "Add current, authentic product and service photos."] },
      { heading: "Connect discovery to a booking", paragraphs: [
        "If a customer searches for a birthday cake in Thrissur, the next step should be obvious: view products, confirm delivery options, ask a question or order. A profile visit without a reliable response path is an operational leak.",
        "Use one clear landing page for important services and locations. Keep delivery coverage, opening hours, prices and service promises current. Do not publish an instant-delivery promise until dispatch is operational."
      ], actions: ["Test the full enquiry flow as a new customer.", "Define who responds to calls and messages.", "Track genuine enquiries separately from profile views."] },
      { heading: "Build reputation ethically", paragraphs: [
        "Request reviews from actual customers without incentives conditioned on a positive rating. Respond respectfully, investigate negative feedback and record recovery actions. Never automate review responses without a review and approval policy."
      ] }
    ]
  },
  {
    slug: "google-search-console-business-owner-guide",
    title: "Read Google Search Console like a business owner",
    description: "Understand clicks, impressions, CTR, query intent and indexing without mistaking traffic for revenue.",
    category: "Analytics",
    audience: "Founders and marketers",
    readMinutes: 5,
    sections: [
      { heading: "Know what the numbers mean", paragraphs: [
        "Impressions indicate that a search result was shown under Search Console's reporting rules. Clicks indicate visits from search results. Click-through rate compares clicks with impressions; average position is an aggregate rather than a fixed rank.",
        "Separate branded searches from customer-problem searches when judging market reach. A higher impression count does not necessarily mean more qualified buyers."
      ], actions: ["Compare the last complete 28 days with an appropriate prior period.", "Segment high-intent pages from informational guides.", "Identify queries with impressions but weak click-through."] },
      { heading: "Connect SEO to operations", paragraphs: [
        "Search Console alone does not tell you how many orders were fulfilled. Link it, with permission, to analytics events, lead records, bookings and invoiced revenue. Agree on attribution windows before reporting results.",
        "An owner-approved recommendation may be to improve a landing page, explain delivery availability or repair an indexing error. Each change should have a reason, owner and measurable outcome."
      ] },
      { heading: "Use authorized data", paragraphs: [
        "Only connect properties owned by the business or explicitly delegated to your team. OAuth tokens belong in secure server-side storage, not browser code, AI prompts or automation logs. If a property has no verified connection, label its data unavailable instead of making estimates."
      ] }
    ]
  },
  {
    slug: "ai-search-readiness-for-real-businesses",
    title: "AI search readiness without guaranteed citations",
    description: "What a business can actually improve for AI-assisted search experiences.",
    category: "AI search",
    audience: "Businesses and agencies",
    readMinutes: 5,
    sections: [
      { heading: "Publish information worth discovering", paragraphs: [
        "Clear service explanations, real product details, frequently asked questions and consistent business information help people and search systems understand a company. Create pages around the questions customers genuinely ask.",
        "AI-powered search products choose and summarize sources differently. No responsible agency can guarantee inclusion, citation placement or traffic from AI-generated answers."
      ], actions: ["Write accurate pages for key services and industries.", "Make authorship and contact information easy to find.", "Keep critical product and availability claims up to date."] },
      { heading: "Keep technical foundations healthy", paragraphs: [
        "Accessible pages, meaningful links, consistent canonical URLs and relevant structured data support general discoverability. Treat these as useful foundations, not secret AI-ranking switches.",
        "Measure identifiable referrals and changes in branded demand where tools permit. Do not use a fabricated universal 'AI visibility score' in customer reports."
      ] },
      { heading: "Prioritize conversion", paragraphs: [
        "A well-informed visitor still needs a way to purchase, book, enquire or speak to your business. Test that handoff and its response time before investing heavily in more content."
      ] }
    ]
  },
  {
    slug: "seo-to-leads-bookings-and-revenue",
    title: "Measure SEO against leads, bookings and revenue",
    description: "Build a simple funnel showing whether search visibility creates commercial value.",
    category: "Analytics",
    audience: "Founders and operators",
    readMinutes: 5,
    sections: [
      { heading: "Choose an honest funnel", paragraphs: [
        "A practical funnel is search landing-page visit, qualified enquiry, confirmed booking or order, payment and repeat business. Each stage needs a consistent event definition and responsible system.",
        "Avoid treating a Google Business Profile view, a call-button click and a paid invoice as equivalent conversions. They describe different steps and must remain separate in reporting."
      ], actions: ["Define what qualifies a lead.", "Deduplicate repeated enquiries from the same customer.", "Reconcile completed orders against payment records."] },
      { heading: "Attribute carefully", paragraphs: [
        "Store consented campaign identifiers and landing-page context with enquiries. Report 'attributed' revenue only when the agreed model and business records support it. Otherwise use 'associated enquiries' or 'unattributed sales'.",
        "Short-term ranking fluctuations are not a reason to rewrite the whole website. Prioritize persistent technical problems and conversion bottlenecks with the greatest likely operational impact."
      ] },
      { heading: "Report costs as well as outcomes", paragraphs: [
        "Track acquisition cost, time to first useful recommendation, cost to serve, accepted proposals and retained customers. If monthly reporting costs more to deliver than the subscription margin, simplify the service before scaling it."
      ] }
    ]
  },
  {
    slug: "local-content-strategy-kerala-businesses",
    title: "Local content strategy for businesses in Kerala",
    description: "Create original English and Malayalam content around real services, locations and customer questions.",
    category: "Local discovery",
    audience: "Kerala SMBs",
    readMinutes: 5,
    sections: [
      { heading: "Research actual questions", paragraphs: [
        "Start with sales calls, WhatsApp conversations and service enquiries. A bakery might need clear explanations of cake sizes, ordering deadlines and delivery coverage; a salon may need treatment suitability, booking rules and operating hours.",
        "Do not generate dozens of near-identical city pages with only place names swapped. Publish genuinely useful location details, or maintain a single strong service-area page."
      ], actions: ["Collect ten recurring pre-sale questions.", "Map each question to an existing or new useful page.", "Include current location and service information only when verified."] },
      { heading: "Design bilingual pages intentionally", paragraphs: [
        "If you publish English and Malayalam equivalents, use clear separate URLs and accurate translations that preserve meaning. Consider language annotations when equivalent versions actually exist, and provide simple navigation between them.",
        "Use real photographs, clear headings, concise answers and human review. A long article that cannot help a customer make a decision is not automatically better."
      ] },
      { heading: "Maintain what you publish", paragraphs: [
        "Assign a reviewer for changing prices, hours, addresses, product availability and regulations. Measure assisted enquiries and actual purchases where attribution is available. Content is an operating asset, not a one-time bulk-generation exercise."
      ] }
    ]
  }
];

export const GROWTH_CATEGORIES = ["All", "Technical SEO", "Local discovery", "Analytics", "AI search"] as const;
export function findGrowthGuide(slug: string): GrowthGuide | undefined {
  return GROWTH_GUIDES.find((guide) => guide.slug === slug);
}
