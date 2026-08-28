import { Scissors, Phone, UserCheck, Calendar, Truck, Building2, Stethoscope, ShoppingBag, Clock, ShieldCheck, MapPin, Activity, Package, CreditCard, HeartPulse, Home, Key, RefreshCw, HelpCircle, Utensils, ClipboardList, ChefHat, LucideIcon } from 'lucide-react';

export interface PosIntegrationItem {
  name: string;
  tag: string;
  description: string;
}

export interface IndustryData {
  id: string;
  name: string;
  icon: LucideIcon;
  hero: {
    title: string;
    highlight: string;
    subtitle: string;
  };
  flow: {
    step1: { title: string; desc: string; icon: LucideIcon };
    step2: { title: string; desc: string; icon: LucideIcon };
    step3: { title: string; desc: string; icon: LucideIcon };
  };
  posIntegrations?: {
    title?: string;
    subtitle?: string;
    featured: PosIntegrationItem[];
    customNotice: string;
  };
  useCases: {
    title: string;
    trigger: string;
    query: string;
    response: string;
    icon: LucideIcon;
  }[];
  stats: {
    val: string;
    label: string;
    suffix: string;
  }[];
  colorTheme: string;
}

export const industriesData: Record<string, IndustryData> = {
  'salon': {
    id: 'salon',
    name: 'Salons & Spas',
    icon: Scissors,
    colorTheme: 'purple',
    hero: {
      title: "Focus on the Cut.",
      highlight: "We'll Handle the Call.",
      subtitle: "The AI Receptionist that knows your services, checks your calendar, and books clients while you're busy with your hands."
    },
    flow: {
      step1: { title: "Client Calls", desc: "\"Do you have an opening for a cut this Friday?\"", icon: Phone },
      step2: { title: "AI Checks Schedule", desc: "Instantly scans Vagaro/GlossGenius for gaps.", icon: UserCheck },
      step3: { title: "Booked & Synced", desc: "Appointment added, deposit link sent via SMS.", icon: Calendar }
    },
    posIntegrations: {
      title: "Salon Booking & Software Sync",
      subtitle: "Direct 2-way sync with popular salon & spa management tools.",
      featured: [
        { name: "Vagaro", tag: "Direct Sync", description: "Real-time calendar checking, stylist availability, and service package booking." },
        { name: "GlossGenius", tag: "Instant Booking", description: "Automatic appointment creation, client profile sync, and deposit collection." },
        { name: "Boulevard / Mindbody", tag: "Seamless Webhook", description: "Live schedule lookups and automated SMS appointment confirmations." }
      ],
      customNotice: "Using a custom salon software or proprietary calendar? We build direct custom API & webhook integrations within 48 hours."
    },
    useCases: [
      { title: "Specific Stylist", trigger: "Client asks:", query: "I need a balayage with Sarah.", response: "AI checks Sarah's specific calendar for color duration slots.", icon: Scissors },
      { title: "Late Rescheduling", trigger: "Client says:", query: "I'm running 15 mins late!", response: "AI checks buffer time or offers to reschedule to later that day.", icon: Clock },
      { title: "Upselling", trigger: "Client books:", query: "Just a haircut please.", response: "AI suggests: 'Would you like to add a conditioning treatment for $20?'", icon: ShoppingBag }
    ],
    stats: [
      { val: "0", label: "Missed Calls", suffix: "" },
      { val: "24/7", label: "Booking Availability", suffix: "" },
      { val: "3x", label: "More Consultations", suffix: "" },
      { val: "15", label: "Hrs Saved / Week", suffix: "+" }
    ]
  },
  'restaurant': {
    id: 'restaurant',
    name: 'Restaurants & Takeaways',
    icon: Utensils,
    colorTheme: 'orange',
    hero: {
      title: "Serve More Guests.",
      highlight: "Never Miss an Order.",
      subtitle: "From table reservations to complex takeout orders, our AI handles the rush so your kitchen can focus on the food."
    },
    flow: {
      step1: { title: "Guest Calls", desc: "\"I'd like a table for 4 at 7 PM tonight.\"", icon: Phone },
      step2: { title: "AI Manages Floor", desc: "Syncs with OpenTable or Resy to confirm availability.", icon: ClipboardList },
      step3: { title: "Order/Table Set", desc: "Reservation confirmed and kitchen notified of orders.", icon: ChefHat }
    },
    posIntegrations: {
      title: "POS & Ordering System Integrations",
      subtitle: "Direct 2-way sync with your favorite restaurant software & kitchen display systems.",
      featured: [
        { name: "Square POS", tag: "Native Integration", description: "Direct order dispatch, live menu availability checks, and automatic kitchen ticket printing." },
        { name: "Toast POS", tag: "Live Kitchen Sync", description: "Fires takeout & delivery orders directly to your KDS and updates ticket status in real time." },
        { name: "Clover & TouchBistro", tag: "Direct Webhook", description: "Automated table management, modifier sync, and instant SMS payment collection." }
      ],
      customNotice: "Using a custom or proprietary POS system? We can integrate directly with ANY POS platform via custom webhooks or direct API in less than 48 hours."
    },
    useCases: [
      { title: "Takeout Orders", trigger: "Customer calls:", query: "Can I get a large pepperoni and two cokes?", response: "AI confirms items, calculates total, and processes payment link.", icon: ShoppingBag },
      { title: "Large Group Booking", trigger: "Guest asks:", query: "Do you have room for a party of 12 on Saturday?", response: "AI checks large-table availability and pre-collects deposit if needed.", icon: Calendar },
      { title: "Allergy Queries", trigger: "Caller asks:", query: "Which of your pastas are gluten-free?", response: "AI reads the live menu specs and confirms the safest options.", icon: HelpCircle }
    ],
    stats: [
      { val: "25%", label: "Increase in Bookings", suffix: "" },
      { val: "0", label: "Abandoned Calls", suffix: "" },
      { val: "100%", label: "Order Accuracy", suffix: "" },
      { val: "30", label: "Hrs Saved / Week", suffix: "+" }
    ]
  },
  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate',
    icon: Building2,
    colorTheme: 'blue',
    hero: {
      title: "Capture Every Lead.",
      highlight: "Sell More Homes.",
      subtitle: "Never let a voicemail block a sale. AI qualifies buyers, schedules viewings, and syncs with your CRM instantly."
    },
    flow: {
      step1: { title: "Lead Calls", desc: "\"I saw the sign on Maple Street.\"", icon: Phone },
      step2: { title: "AI Qualifies", desc: "Checks budget, timeline, and pre-approval status.", icon: ShieldCheck },
      step3: { title: "Viewing Scheduled", desc: "Booked directly into agent's calendar.", icon: Key }
    },
    posIntegrations: {
      title: "Real Estate CRM & MLS Sync",
      subtitle: "Automatic lead routing and calendar sync with your real estate tech stack.",
      featured: [
        { name: "Follow Up Boss", tag: "Instant CRM Sync", description: "Pushes call transcripts, lead details, and qualified buyer ratings directly into your feed." },
        { name: "kvCORE", tag: "Lead Routing", description: "Automated buyer qualification and instant open-house attendee registration." },
        { name: "Salesforce / HubSpot", tag: "Enterprise API", description: "Full contact record updates, viewing task creation, and automated drip triggers." }
      ],
      customNotice: "Using a custom real estate CRM or local MLS system? We support direct custom integrations with any database."
    },
    useCases: [
      { title: "After-Hours Leads", trigger: "Lead calls at 9PM:", query: "Is 123 Oak St still available?", response: "AI confirms availability and books a viewing for tomorrow morning.", icon: Home },
      { title: "Tenant Screening", trigger: "Renter calls:", query: "I want to rent the downtown loft.", response: "AI asks: 'Do you meet the 3x income requirement and have references?'", icon: UserCheck },
      { title: "Open House RSVP", trigger: "Caller asks:", query: "When is the open house?", response: "AI provides details and registers them for the guest list.", icon: MapPin }
    ],
    stats: [
      { val: "100%", label: "Lead Capture Rate", suffix: "" },
      { val: "< 1m", label: "Speed to Lead", suffix: "" },
      { val: "20%", label: "Increase in Viewings", suffix: "" },
      { val: "40", label: "Hrs Saved / Month", suffix: "+" }
    ]
  },
  'logistics': {
    id: 'logistics',
    name: 'Logistics',
    icon: Truck,
    colorTheme: 'orange',
    hero: {
      title: "Keep Drivers Moving.",
      highlight: "Automate Dispatch.",
      subtitle: "Handle driver check-ins, delivery status queries, and rescheduling without tying up your dispatch team."
    },
    flow: {
      step1: { title: "Driver/Customer Calls", desc: "\"Where is my package?\" or \"I'm at the dock.\"", icon: Phone },
      step2: { title: "AI Tracks Order", desc: "Queries TMS/ERP for real-time location status.", icon: MapPin },
      step3: { title: "Update Sent", desc: "Provides ETA or updates dock assignment.", icon: Package }
    },
    posIntegrations: {
      title: "TMS & Dispatch System Integrations",
      subtitle: "Real-time connectivity with your transportation and fleet management software.",
      featured: [
        { name: "Samsara", tag: "Fleet GPS Sync", description: "Queries live vehicle locations and provides accurate ETAs to calling customers." },
        { name: "McLeod Software", tag: "Dispatch Integration", description: "Logs driver arrivals, updates load statuses, and clears dock bottlenecks automatically." },
        { name: "Freight360 / Custom TMS", tag: "API Connector", description: "Automated load tracking updates and instantaneous SMS manifest delivery." }
      ],
      customNotice: "Operating a proprietary TMS or custom dispatch server? We build direct custom API connectors tailored to your workflow."
    },
    useCases: [
      { title: "Delivery Reschedule", trigger: "Customer calls:", query: "I won't be home today.", response: "AI offers next available slots and updates the route manifest.", icon: Calendar },
      { title: "Driver Check-In", trigger: "Driver calls:", query: "Arrived at Warehouse B.", response: "AI logs timestamp and texts the door number to the driver.", icon: Truck },
      { title: "WISMO Calls", trigger: "Customer calls:", query: "Where is my order #1234?", response: "AI: 'It's out for delivery, ETA 2:30 PM.'", icon: Package }
    ],
    stats: [
      { val: "60%", label: "Fewer Support Tickets", suffix: "" },
      { val: "24/7", label: "Driver Support", suffix: "" },
      { val: "$5k", label: "Saved per Month", suffix: "+" },
      { val: "0", label: "Hold Times", suffix: "" }
    ]
  },
  'healthcare': {
    id: 'healthcare',
    name: 'Healthcare',
    icon: Stethoscope,
    colorTheme: 'cyan',
    hero: {
      title: "Compassionate Care.",
      highlight: "Zero Hold Times.",
      subtitle: "Answering clinic FAQs, verifying insurance eligibility, and booking appointments with HIPAA-compliant AI voice agents."
    },
    flow: {
      step1: { title: "Patient Calls", desc: "\"I need to schedule a consultation with Dr. Smith.\"", icon: Phone },
      step2: { title: "AI Checks Schedule", desc: "Verifies insurance eligibility & provider calendar availability.", icon: Activity },
      step3: { title: "Appointment Set", desc: "Synced to EMR, pre-visit paperwork link sent via SMS.", icon: HeartPulse }
    },
    posIntegrations: {
      title: "EMR & EHR Software Sync",
      subtitle: "HIPAA-compliant integration with major healthcare practice management systems.",
      featured: [
        { name: "Epic Systems", tag: "HIPAA Compliant", description: "Secure appointment scheduling, patient intake logging, and provider schedule sync." },
        { name: "Cerner / Oracle Health", tag: "EHR Sync", description: "Automated appointment scheduling, pre-visit paperwork reminders, and clinic location routing." },
        { name: "AthenaHealth", tag: "Live Sync", description: "Real-time doctor calendar queries and automated patient reminder calling." }
      ],
      customNotice: "Need integration with a custom EMR or specialized clinic software? We offer custom HIPAA-compliant API integrations."
    },
    useCases: [
      { title: "Clinic Hours & Location", trigger: "Caller asks:", query: "Where are you located and what are your office hours?", response: "AI provides exact address, parking instructions, and operating hours.", icon: HelpCircle },
      { title: "Appointment Reminder", trigger: "System calls:", query: "Confirming your visit tomorrow.", response: "AI handles confirmation or offers rescheduling if patient is busy.", icon: Calendar },
      { title: "Insurance & Coverage", trigger: "Patient asks:", query: "Do you accept BlueCross BlueShield insurance?", response: "AI checks accepted provider database and confirms coverage guidelines.", icon: ShieldCheck }
    ],
    stats: [
      { val: "30%", label: "Lower No-Show Rate", suffix: "" },
      { val: "95%", label: "Patient Satisfaction", suffix: "" },
      { val: "500+", label: "Hrs Saved / Year", suffix: "" },
      { val: "100%", label: "HIPAA Compliant", suffix: "" }
    ]
  },
  'retail': {
    id: 'retail',
    name: 'Retail',
    icon: ShoppingBag,
    colorTheme: 'green',
    hero: {
      title: "Turn Support",
      highlight: "Into Sales.",
      subtitle: "Answer product questions, process returns, and check inventory levels instantly. Never miss a sale due to busy lines."
    },
    flow: {
      step1: { title: "Shopper Calls", desc: "\"Do you have these sneakers in size 10?\"", icon: Phone },
      step2: { title: "AI Checks Stock", desc: "Queries inventory management system live.", icon: Package },
      step3: { title: "Sale Saved", desc: "Confirms stock, reserves item, or places ship-to-home order.", icon: CreditCard }
    },
    posIntegrations: {
      title: "E-Commerce & Retail POS Sync",
      subtitle: "Live inventory lookups and order management across physical and online stores.",
      featured: [
        { name: "Shopify POS", tag: "Live Stock Sync", description: "Real-time SKU lookup, instant return QR code generation, and store pickup reserves." },
        { name: "Lightspeed Retail", tag: "POS Order Fire", description: "Instant in-store pickup holding, inventory status checks, and customer loyalty lookups." },
        { name: "WooCommerce / Square", tag: "Direct Webhook", description: "Automated tracking status delivery and customer order history querying." }
      ],
      customNotice: "Using a custom retail ERP or warehouse management tool? We build direct custom integrations for any system."
    },
    useCases: [
      { title: "Return Processing", trigger: "Customer calls:", query: "I need to return this shirt.", response: "AI generates QR code and emails return label instantly.", icon: RefreshCw },
      { title: "Order Status", trigger: "Customer calls:", query: "Has my gift shipped?", response: "AI tracks shipment and sends SMS update.", icon: Truck },
      { title: "Product FAQ", trigger: "Customer asks:", query: "Is this gluten-free?", response: "AI reads product spec sheet and confirms details.", icon: HelpCircle }
    ],
    stats: [
      { val: "40%", label: "Deflection Rate", suffix: "" },
      { val: "2x", label: "Faster Resolution", suffix: "" },
      { val: "24/7", label: "Sales Assistant", suffix: "" },
      { val: "15%", label: "Revenue Lift", suffix: "" }
    ]
  }
};

