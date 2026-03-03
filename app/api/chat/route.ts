import { NextRequest, NextResponse } from "next/server";

type ChatLink = { label: string; href: string };
type Lang = "en" | "ml";

/**
 * Phase 2: Chat API route.
 * Returns contextual RINPO responses. Supports English and Malayalam (lang: "en" | "ml").
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = (body.message as string)?.trim?.() ?? "";
    const requestedLang: Lang = body.lang === "ml" ? "ml" : "en";
    // Auto-detect Malayalam in user input (Unicode \u0D00-\u0D7F) for true 2-way conversation
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(message);
    const lang: Lang = hasMalayalam || requestedLang === "ml" ? "ml" : "en";

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const lower = message.toLowerCase();
    let reply: string;
    let links: ChatLink[] = [];
    let intent: string = "default";

    // Custom Software
    if (
      lower.includes("custom software") ||
      (lower.includes("custom") && (lower.includes("software") || lower.includes("app") || lower.includes("development")))
    ) {
      reply =
        "RINADS builds **Custom Software** tailored to your business: Web Apps, Mobile Apps, and ERP Systems. " +
        "We deliver solutions that fit exactly how you work—no one-size-fits-all. Ready to explore?";
      links = [
        { label: "View Services", href: "/services" },
        { label: "Get a Free Consultation", href: "/contact" },
      ];
      intent = "customSoftware";
    }
    // Digital Marketing
    else if (
      lower.includes("digital marketing") ||
      lower.includes("marketing") ||
      lower.includes("seo") ||
      lower.includes("social media") ||
      lower.includes("ads")
    ) {
      reply =
        "Our **Digital Marketing** services include SEO, Social Media, and Performance Ads. " +
        "We help you reach more customers and grow your brand. Check our full offerings.";
      links = [
        { label: "Services Page", href: "/services" },
        { label: "Contact Us", href: "/contact" },
      ];
      intent = "digitalMarketing";
    }
    // AI Automation
    else if (
      lower.includes("ai") ||
      lower.includes("automation") ||
      lower.includes("chatbot") ||
      lower.includes("workflow")
    ) {
      reply =
        "**AI Automation** at RINADS covers Chatbots, Workflow Automation, and AI Tools. " +
        "Less paperwork, more clarity. We help you automate operations so you can focus on growth.";
      links = [
        { label: "Explore Services", href: "/services" },
        { label: "Rinads Cloud", href: "/rinads-cloud" },
      ];
      intent = "aiAutomation";
    }
    // Services (incl. Malayalam: സേവനങ്ങൾ)
    else if (
      lower.includes("service") ||
      lower.includes("services") ||
      lower.includes("offer") ||
      lower.includes("what do you") ||
      lower.includes("സേവന")
    ) {
      reply =
        "RINADS offers three core services: **Digital Marketing** (SEO, Social Media, Performance Ads), " +
        "**Custom Software** (Web Apps, Mobile Apps, ERP Systems), and **AI Automation** (Chatbots, Workflow, AI Tools). " +
        "What would you like to know more about?";
      links = [
        { label: "Full Services", href: "/services" },
        { label: "Home", href: "/" },
      ];
      intent = "services";
    }
    // Contact / Consultation / Contact details (incl. Malayalam: സമ്പർക്കം, ഫോൺ, etc.)
    else if (
      lower.includes("contact detail") ||
      lower.includes("contact info") ||
      lower.includes("phone number") ||
      lower.includes("email") ||
      lower.includes("address") ||
      lower.includes("contact") ||
      lower.includes("consultation") ||
      lower.includes("reach") ||
      lower.includes("call") ||
      lower.includes("phone") ||
      lower.includes("whatsapp") ||
      lower.includes("സമ്പർക്ക") ||
      lower.includes("വിവരങ്ങൾ") ||
      lower.includes("ഫോൺ") ||
      lower.includes("നമ്പർ") ||
      lower.includes("ഇമെയിൽ") ||
      lower.includes("വിലാസം") ||
      lower.includes("വാട്സാപ്പ്")
    ) {
      reply =
        "Reach RINADS for a **free consultation**: Phone +91 89211 95996, website www.rinads.com, WhatsApp available. " +
        "We're here to help—India and globally.";
      links = [
        { label: "Contact Page", href: "/contact" },
      ];
      intent = "contact";
    }
    // Rinads Cloud / ERP
    else if (
      lower.includes("cloud") ||
      lower.includes("erp") ||
      lower.includes("portal") ||
      lower.includes("client") ||
      lower.includes("invoice") ||
      lower.includes("ക്ലൗഡ്") ||
      lower.includes("പോർട്ടൽ") ||
      lower.includes("ഇൻവോയ്സ്")
    ) {
      reply =
        "**Rinads Cloud** is our Business Cloud platform—Software, Websites, Marketing. " +
        "RINADS Intelligence and full ERP features are available. Open the Portal tab in this phone for invoices and client dashboard.";
      links = [
        { label: "Rinads Cloud", href: "/rinads-cloud" },
      ];
      intent = "cloud";
    }
    // Home / About
    else if (
      lower.includes("home") ||
      lower.includes("about") ||
      lower.includes("rinads") ||
      lower.includes("who are you") ||
      lower.includes("business simplified") ||
      lower.includes("ആരാണ്") ||
      lower.includes("എന്താണ്") ||
      lower.includes("റിനാഡ്സ്")
    ) {
      reply =
        "RINADS stands for **Business Simplified**. We provide Digital Marketing, Custom Software, and AI Automation. " +
        "Whether you run a Salon, Accounting Firm, Clinic, or Manufacturing—we've got you covered.";
      links = [
        { label: "Home", href: "/" },
        { label: "Services", href: "/services" },
      ];
      intent = "home";
    }
    // Support / Help (incl. Malayalam: സഹായം, പ്രശ്നം)
    else if (
      lower.includes("support") ||
      lower.includes("help") ||
      lower.includes("issue") ||
      lower.includes("സഹായം") ||
      lower.includes("പ്രശ്നം") ||
      lower.includes("എന്ത് സഹായം")
    ) {
      reply =
        "I'm here to help! Use the Support tab in this phone, or contact us directly. " +
        "Reach out at +91 89211 95996 or www.rinads.com for urgent support.";
      links = [
        { label: "Contact", href: "/contact" },
      ];
      intent = "support";
    }
    // Reminders / Plans
    else if (
      lower.includes("reminder") ||
      lower.includes("plan") ||
      lower.includes("calendar") ||
      lower.includes("ഓർമ്മ") ||
      lower.includes("പ്ലാൻ")
    ) {
      reply =
        "Open the **Plans & Reminders** tab to add reminders. You can create plans and I'll help you stay on track.";
      links = [];
      intent = "reminders";
    }
    // Greetings (incl. Malayalam: നമസ്കാരം, ഹലോ, etc.)
    else if (
      lower.includes("hello") ||
      lower.includes("hi") ||
      lower.includes("hey") ||
      lower.includes("good morning") ||
      lower.includes("good afternoon") ||
      lower.includes("നമസ്കാരം") ||
      lower.includes("ഹലോ") ||
      lower.includes("ഹായ്") ||
      lower.includes("വണക്കം")
    ) {
      reply =
        "Hi! I'm RINPO, your RINADS assistant. Ask me about our services, contact info, or the client portal. Business simplified.";
      links = [
        { label: "Services", href: "/services" },
        { label: "Contact", href: "/contact" },
      ];
      intent = "greetings";
    }
    // Thanks (incl. Malayalam: നന്ദി)
    else if (lower.includes("thank") || lower.includes("നന്ദി") || lower.includes("ധന്യവാദം")) {
      reply = "You're welcome! Business simplified. Anything else I can help with?";
      links = [];
      intent = "thanks";
    }
    // Pricing / Cost (incl. Malayalam: വില, ചിലവ്)
    else if (
      lower.includes("price") ||
      lower.includes("cost") ||
      lower.includes("how much") ||
      lower.includes("pricing") ||
      lower.includes("വില") ||
      lower.includes("ചിലവ്")
    ) {
      reply =
        "Pricing depends on your needs. Book a **free consultation** and we'll tailor a plan for you. " +
        "No commitment—just a conversation about how we can help.";
      links = [
        { label: "Get Free Consultation", href: "/contact" },
      ];
      intent = "pricing";
    }
    // Web apps / Mobile / ERP (incl. Malayalam: വെബ് ആപ്പ്, ആപ്പ്)
    else if (
      lower.includes("web app") ||
      lower.includes("mobile app") ||
      lower.includes("erp") ||
      lower.includes("വെബ് ആപ്പ്") ||
      lower.includes("മൊബൈൽ ആപ്പ്") ||
      lower.includes("ആപ്പ് നിർമ്മിക്ക")
    ) {
      reply =
        "We build **Web Apps**, **Mobile Apps**, and **ERP Systems**—all custom to your business. " +
        "From appointments and billing to inventory and CRM, we automate the details.";
      links = [
        { label: "Services", href: "/services" },
        { label: "Contact", href: "/contact" },
      ];
      intent = "webApps";
    }
    // Default
    else {
      reply =
        "I can help with **Services** (Digital Marketing, Custom Software, AI Automation), **Contact** info, " +
        "the **Client Portal**, or **Rinads Cloud**. What would you like to explore?";
      links = [
        { label: "Services", href: "/services" },
        { label: "Contact", href: "/contact" },
        { label: "Home", href: "/" },
      ];
    }

    // Malayalam translations when lang is ml - use intent from above logic
    if (lang === "ml") {
      const mlMap: Record<string, { reply: string; links: ChatLink[] }> = {
        customSoftware: {
          reply:
            "RINADS നിങ്ങളുടെ ബിസിനസ്സിന് അനുയോജ്യമായ **കസ്റ്റം സോഫ്റ്റ്വെയർ** നിർമ്മിക്കുന്നു: വെബ് ആപ്പുകൾ, മൊബൈൽ ആപ്പുകൾ, ERP സിസ്റ്റങ്ങൾ. പര്യവേക്ഷണം ചെയ്യാൻ തയ്യാറാണോ?",
          links: [
            { label: "സേവനങ്ങൾ കാണുക", href: "/services" },
            { label: "സൗജന്യ യോഗ്യാഭ്യാസം", href: "/contact" },
          ],
        },
        digitalMarketing: {
          reply:
            "ഞങ്ങളുടെ **ഡിജിറ്റൽ മാർക്കറ്റിംഗ്** സേവനങ്ങളിൽ SEO, സോഷ്യൽ മീഡിയ, പെർഫോർമൻസ് വിജ്ഞാപനങ്ങൾ ഉൾപ്പെടുന്നു. കൂടുതൽ ഉപഭോക്താക്കളെ എത്തിക്കാനും ബ്രാൻഡ് വളർത്താനും ഞങ്ങൾ സഹായിക്കുന്നു.",
          links: [
            { label: "സേവനങ്ങൾ", href: "/services" },
            { label: "ബന്ധപ്പെടുക", href: "/contact" },
          ],
        },
        aiAutomation: {
          reply:
            "RINADS-ൽ **AI ഓട്ടോമേഷൻ** ചാറ്റ്ബോട്ടുകൾ, വർക്ക്ഫ്ലോ ഓട്ടോമേഷൻ, AI ടൂളുകൾ ഉൾപ്പെടുന്നു. കുറഞ്ഞ പേപ്പർവർക്ക്, കൂടുതൽ വ്യക്തത.",
          links: [
            { label: "സേവനങ്ങൾ", href: "/services" },
            { label: "Rinads Cloud", href: "/rinads-cloud" },
          ],
        },
        services: {
          reply:
            "RINADS മൂന്ന് പ്രധാന സേവനങ്ങൾ വാഗ്ദാനം ചെയ്യുന്നു: **ഡിജിറ്റൽ മാർക്കറ്റിംഗ്**, **കസ്റ്റം സോഫ്റ്റ്വെയർ**, **AI ഓട്ടോമേഷൻ**. എന്തിനെക്കുറിച്ച് കൂടുതൽ അറിയാൻ ആഗ്രഹിക്കുന്നു?",
          links: [
            { label: "സേവനങ്ങൾ", href: "/services" },
            { label: "ഹോം", href: "/" },
          ],
        },
        contact: {
          reply:
            "RINADS-ൽ **സൗജന്യ യോഗ്യാഭ്യാസത്തിനായി** ബന്ധപ്പെടുക: ഫോൺ +91 89211 95996, വെബ്സൈറ്റ് www.rinads.com, WhatsApp ലഭ്യം. ഇന്ത്യയിലും ലോകമെമ്പാടും സഹായിക്കാൻ ഞങ്ങൾ ഇവിടെയുണ്ട്.",
          links: [{ label: "ബന്ധപ്പെടുക", href: "/contact" }],
        },
        cloud: {
          reply:
            "**Rinads Cloud** ഞങ്ങളുടെ ബിസിനസ്സ് ക്ലൗഡ് പ്ലാറ്റ്ഫോമാണ്. RINADS Intelligence, പൂർണ്ണ ERP ഫീച്ചറുകൾ ലഭ്യം. ഇൻവോയ്സുകൾക്ക് ഈ ഫോണിലെ പോർട്ടൽ ടാബ് തുറക്കുക.",
          links: [{ label: "Rinads Cloud", href: "/rinads-cloud" }],
        },
        home: {
          reply:
            "RINADS എന്നാൽ **ബിസിനസ്സ് ലളിതമാക്കൽ**. ഞങ്ങൾ ഡിജിറ്റൽ മാർക്കറ്റിംഗ്, കസ്റ്റം സോഫ്റ്റ്വെയർ, AI ഓട്ടോമേഷൻ നൽകുന്നു.",
          links: [
            { label: "ഹോം", href: "/" },
            { label: "സേവനങ്ങൾ", href: "/services" },
          ],
        },
        support: {
          reply:
            "സഹായിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്! ഈ ഫോണിലെ സപ്പോർട്ട് ടാബ് ഉപയോഗിക്കുക. ഇടിയൻഷ്യ സപ്പോർട്ടിന് +91 89211 95996 അല്ലെങ്കിൽ www.rinads.com ബന്ധപ്പെടുക.",
          links: [{ label: "ബന്ധപ്പെടുക", href: "/contact" }],
        },
        reminders: {
          reply: "റിമൈൻഡറുകൾ ചേർക്കാൻ **പ്ലാനുകൾ ആൻഡ് റിമൈൻഡറുകൾ** ടാബ് തുറക്കുക.",
          links: [],
        },
        greetings: {
          reply:
            "നമസ്കാരം! ഞാൻ RINPO, നിങ്ങളുടെ RINADS അസിസ്റ്റന്റ്. സേവനങ്ങൾ, സമ്പർക്ക വിവരങ്ങൾ, ക്ലയന്റ് പോർട്ടൽ എന്നിവയെക്കുറിച്ച് ചോദിക്കുക. ബിസിനസ്സ് ലളിതമാക്കൽ.",
          links: [
            { label: "സേവനങ്ങൾ", href: "/services" },
            { label: "ബന്ധപ്പെടുക", href: "/contact" },
          ],
        },
        thanks: {
          reply: "സ്വാഗതം! ബിസിനസ്സ് ലളിതമാക്കൽ. എന്തെങ്കിലും മറ്റൊന്ന് സഹായിക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?",
          links: [],
        },
        pricing: {
          reply:
            "വില നിങ്ങളുടെ ആവശ്യങ്ങളെ അടിസ്ഥാനമാക്കിയുള്ളതാണ്. **സൗജന്യ യോഗ്യാഭ്യാസം** ബുക്ക് ചെയ്യുക, ഞങ്ങൾ നിങ്ങൾക്ക് സജ്ജമായ പ്ലാൻ ഉണ്ടാക്കും.",
          links: [{ label: "സൗജന്യ യോഗ്യാഭ്യാസം", href: "/contact" }],
        },
        webApps: {
          reply:
            "ഞങ്ങൾ **വെബ് ആപ്പുകൾ**, **മൊബൈൽ ആപ്പുകൾ**, **ERP സിസ്റ്റങ്ങൾ** നിർമ്മിക്കുന്നു—നിങ്ങളുടെ ബിസിനസ്സിന് അനുയോജ്യമായി.",
          links: [
            { label: "സേവനങ്ങൾ", href: "/services" },
            { label: "ബന്ധപ്പെടുക", href: "/contact" },
          ],
        },
        default: {
          reply:
            "**സേവനങ്ങൾ**, **സമ്പർക്ക വിവരങ്ങൾ**, **ക്ലയന്റ് പോർട്ടൽ**, അല്ലെങ്കിൽ **Rinads Cloud** എന്നിവയിൽ സഹായിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്. എന്ത് പര്യവേക്ഷണം ചെയ്യാൻ ആഗ്രഹിക്കുന്നു?",
          links: [
            { label: "സേവനങ്ങൾ", href: "/services" },
            { label: "ബന്ധപ്പെടുക", href: "/contact" },
            { label: "ഹോം", href: "/" },
          ],
        },
      };
      const ml = mlMap[intent];
      if (ml) {
        reply = ml.reply;
        links = ml.links;
      }
    }

    return NextResponse.json({ reply, links, effectiveLang: lang });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
