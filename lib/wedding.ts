export interface TimelineMoment {
  year: string;
  title: string;
  text: string;
}

export interface ItineraryItem {
  time: string;
  title: string;
  detail: string;
}

export interface RsvpSideOption {
  value: string;
  label: string;
}

export const SITE = {
  title: "R Baala Mugundan & Dr M.Sowmiya — Wedding Invitation",
  description: "Join us in celebrating the wedding of R Baala Mugundan and Dr M.Sowmiya at P.V.K Mahal, Dindigul, Tamil Nadu.",
} as const;

export const WEDDING = {
  brideName: "Dr M.Sowmiya",
  groomName: "R Baala Mugundan",
  coupleNames: "R Baala Mugundan & Dr M.Sowmiya",
  coupleLine: "Two Souls, Bound by Tradition and Eternal Love",
  dateLabel: "25 October 2026",
  dateShort: "25 . 10 . 2026",
  rsvpDeadline: "10 October 2026",
  venue: "P.V.K Mahal",
  city: "Thadikombu Road, Dindigul, Tamil Nadu",
  icsStart: "20261024T180000",
  icsEnd: "20261025T140000",
  caricatureSrc: "/caricature.png",
  caricatureAlt: "Caricature illustration of R Baala Mugundan & Dr M.Sowmiya",
  dateDisplay: "25 October 2026",
  venueShort: "P.V.K Mahal, Dindigul",
} as const;

// --- 1. Hero (video intro) ---
export const HERO = {
  title: "The Wedding Invitation",
  eyebrow: "The Wedding Invitation",
  tagline: "Two Souls, Bound by Tradition and Eternal Love",
  scrollHint: "Scroll down to unseal our invitation",
  scrollIcon: "↓",
  finaleHint: "An eternal union begins",
  loadingLabel: "Preparing celebration...",
  frameAlt: "Envelope opening sequence frame",
} as const;

// --- 2. Storyboard ---
export const STORY = {
  eyebrow: "Our Journey",
  title: "Moments That Led Us Here",
  sub: "A timeless tale of love, family, and divine blessings.",
  caption: "From a gentle first hello under temple arches to tying three holy knots.",
} as const;

// EDIT: replace with the couple's real milestones.
export const STORY_MOMENTS: TimelineMoment[] = [
  {
    year: "2025 / Oct",
    title: "The First Hello",
    text: "Amidst the echo of temple bells, the fragrance of jasmine, and the warm chatter of family, time seemed to freeze. A single glance beneath the ancient temple arches, a gentle smile, and a quiet hello—turning a simple introduction into an undeniable spark, sealed in divine light.",
  },
  {
    year: "2026 / May",
    title: "Two States",
    text: "Late-night calls bridging the distance—turning every mile into timeless devotion.",
  },
  {
    year: "2026 / Aug",
    title: "Bound by Vows",
    text: "Promises spoken, traditions honored, and two paths officially made one.",
  },
  {
    year: "2026 / Oct",
    title: "Kalyanam: The Three Knots",
    text: "To the chant of sacred mantras and the reverberation of the nadaswaram, three holy knots will be tied—binding two souls in eternal grace, love, and tradition.",
  }
];

// --- 3. Scratch-to-reveal date card ---
export const SCRATCH = {
  eyebrow: "Save The Date",
  title: "Unveil Our Sacred Day",
  sub: "Scratch the golden foil below to reveal when we tie the knot.",
  foilTitle: "SCRATCH HERE",
  foilHint: "Drag or scratch across to reveal",
  revealKicker: "The Date Is Revealed!",
  statusRevealed: "25 October 2026 • Dindigul",
  progressPrefix: "Scratched",
  progressSuffix: "%",
  resetLabel: "Scratch again",
} as const;

// --- 4. Itinerary + Add to Calendar ---
export const ITINERARY_COPY = {
  eyebrow: "Celebration Schedule",
  title: "Events & Festivities",
  sub: "Join us across two days of traditional Tamil rituals, grand feasts, and heartfelt celebrations.",
  calendarButton: "Add Kalyanam to Calendar",
  addToCalendar: "Add Kalyanam to Calendar",
  calendarIcon: "📅",
  calendarNotePrefix: "Downloads a ",
  calendarNoteCode: ".ics",
  calendarNoteSuffix: " file that works with Google, Apple & Outlook calendars.",
  icsProdId: "-//WeddingInvite//BaalaWedsSowmiya//EN",
  icsFilename: "baala-weds-sowmiya.ics",
  icsSummaryPrefix: "Wedding — ",
  icsDescription: "Join us in celebrating the wedding of R Baala Mugundan and Dr M.Sowmiya at P.V.K Mahal, Dindigul, Tamil Nadu.",
  icsUidSuffix: "@baala-weds-sowmiya",
} as const;

export const ITINERARY: ItineraryItem[] = [
  {
    time: "6:00 PM (Oct 24)",
    title: "Guest Welcome & Refreshments",
    detail: "Arrive, settle in, and join us for evening drinks and high tea as everyone gathers to kick off the festivities.",
  },
  {
    time: "7:00 PM (Oct 24)",
    title: "Parisam Ceremony (பரிசம்)",
    detail: "The traditional Tamil ritual marking the formal alliance between our families, featuring the exchange of gifts, silk sarees, and blessings for the couple.",
  },
  {
    time: "8:00 PM (Oct 24)",
    title: "Traditional South Indian Dinner",
    detail: "Join us for an authentic South Indian feast served on fresh banana leaves (Elai Saapadu), filled with rich traditional flavors, sweets, and celebrations!",
  },
  {
    time: "7:00 AM (Oct 25)",
    title: "Kalyanam: The Three Knots",
    detail: "Step into a grand mahal filled with divine energy as timeless Tamil traditions unfold. To the soulful sounds of the nadaswaram and sacred mantras, two souls will unite in eternal grace as the holy Mangalyam is tied.",
  },
  {
    time: "8:00 AM (Oct 25)",
    title: "Kalyana Virundhu (Breakfast)",
    detail: "Start the auspicious day with an authentic Tamil feast served fresh on banana leaves—featuring flavorful traditional delicacies to celebrate our special morning.",
  },
  {
    time: "11:00 AM (Oct 25)",
    title: "Ashirvadam & Moments to Cherish",
    detail: "Join the couple on stage under the golden lights to offer your heartfelt ashīrvādam. Strike a pose, capture beautiful memories, and celebrate this timeless union with love and laughter.",
  },
  {
    time: "12:30 PM (Oct 25)",
    title: "Kalyana Virundhu (Lunch)",
    detail: "Relish an unforgettable afternoon feast served on traditional banana leaves—a lavish Tamil culinary journey brimming with aromatic spices, festive spreads, and togetherness to crown our wedding celebrations.",
  }
];

// --- 5. RSVP & wishes form ---
export type RsvpSide = "Bride" | "Groom" | "Both" | "groom" | "bride" | "both";

export const RSVP_SIDE_OPTIONS: RsvpSideOption[] = [
  { value: "groom", label: "Groom's Side (R Baala Mugundan)" },
  { value: "bride", label: "Bride's Side (Dr M.Sowmiya)" },
  { value: "both", label: "Friend / Family to Both" }
];

export const RSVP = {
  eyebrow: "Join Our Celebration",
  title: "Send Your Wishes & RSVP",
  subPrefix: "Please let us know if you will be joining",
  subSuffix: " so we can prepare warm hospitality for you.",
  nameLabel: "Your Name",
  namePlaceholder: "Enter your full name",
  sideLabel: "Whose guest are you?",
  sidePlaceholder: "Select side",
  wishLabel: "Blessings & Wishes",
  wishPlaceholder: "Write your heartfelt message for Baala & Sowmiya...",
  errorMessage: "Something went wrong — please try again.",
  submitLabel: "Send RSVP & Wishes",
  sendingLabel: "Sending...",
  submittingLabel: "Sending...",
  thanksIcon: "💌",
  thanksPrefix: "Thank you,",
  thanksMessage: "Thank you for your blessings! We look forward to celebrating with you.",
} as const;

// --- Footer ---
export const FOOTER = {
  title: "With love, respect & blessings",
  sub: "We warmly invite you and your family to join us on our special day.",
} as const;

