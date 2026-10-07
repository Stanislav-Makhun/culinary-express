// Domain constants, seed data and derived-data helpers for the prototype.
// Everything the UI shows about a Dispatch is derived from the Dispatch record plus these tables.

export const TYPES = {
  catered_delivery: {
    label: 'Catered Delivery',
    blurb: 'Food from any restaurant, delivered and set out. No staff on site.',
  },
  catered_event: {
    label: 'Catered Event',
    blurb: 'Full service: food, staff, services, rentals and guests.',
  },
  onsite_booking: {
    label: 'Onsite Booking',
    blurb: "Book a restaurant's room or chef on site, with staff and guests.",
  },
};

export const LIFECYCLE = ['inquiry', 'planning', 'quoted', 'confirmed', 'live', 'completed'];
export const LIFECYCLE_LABEL = {
  inquiry: 'Inquiry',
  planning: 'Planning',
  quoted: 'Quoted',
  confirmed: 'Confirmed',
  live: 'Live',
  completed: 'Completed',
};

export const STEPS = [
  { key: 'basics', label: 'Basics', hint: 'Type, date, venue and guests' },
  { key: 'vendor', label: 'Vendor', hint: 'Choose a restaurant' },
  { key: 'food', label: 'Food', hint: 'Menu, quantities and service style' },
  { key: 'services', label: 'Services', hint: 'Florist, rentals, photo, music' },
  { key: 'staff', label: 'Staff', hint: 'Roles and counts' },
  { key: 'rsvp', label: 'Guest RSVP', hint: 'Collect RSVPs or skip' },
  { key: 'materials', label: 'Materials', hint: 'Who brings what' },
  { key: 'review', label: 'Review & Quote', hint: 'Check everything, see the estimate' },
];
const HIDDEN_STEPS = {
  catered_delivery: ['services', 'staff', 'rsvp', 'materials'],
  onsite_booking: ['materials'],
  catered_event: [],
};
export const stepsFor = (type) => STEPS.filter((s) => !(HIDDEN_STEPS[type] || []).includes(s.key));

export const SERVICE_STYLES = ['Plated', 'Buffet', 'Family style', 'Stations'];

export const STAFF_ROLES = [
  { role: 'Coordinator', rate: 48, blurb: 'Runs the floor and the run sheet' },
  { role: 'Bartender', rate: 40, blurb: 'Bar setup, service and close' },
  { role: 'Sommelier', rate: 55, blurb: 'Wine pairing and pours' },
  { role: 'Server', rate: 36, blurb: 'Table service and clearing' },
  { role: 'Attendant', rate: 32, blurb: 'Coat check, door, restrooms' },
  { role: 'Cleaner', rate: 30, blurb: 'Breakdown and final clean' },
  { role: 'Delivery', rate: 34, blurb: 'Transport and drop-off' },
];
export const STAFF_RATE = Object.fromEntries(STAFF_ROLES.map((r) => [r.role, r.rate]));

export const MATERIALS = [
  'Tables', 'Chairs', 'Linens', 'Plates', 'Cutlery', 'Glassware',
  'Serving ware', 'Chafing dishes', 'Napkins', 'Centerpieces',
];

export const PERMISSIONS = {
  view: 'Can view',
  comment: 'Can comment',
  suggest: 'Can suggest',
  edit: 'Can edit',
};
export const PERMISSION_HINT = {
  view: 'Sees the Ticket. Cannot change anything.',
  comment: 'Can leave messages on the Ticket.',
  suggest: 'Edits become suggestions the owner accepts or rejects.',
  edit: 'Changes save straight to the Ticket.',
};
export const ROLE_DEFAULT_PERMISSION = { co_planner: 'edit', vendor: 'suggest', staff: 'view' };
export const PARTICIPANT_ROLE_LABEL = {
  owner: 'Owner',
  lead_planner: 'Lead Planner',
  co_planner: 'Co-planner',
  vendor: 'Vendor',
  staff: 'Staff',
};

// One label table for every field the Builder collects. The Ticket, suggestions, Activity
// and the Staff sheet all read labels from here, so nothing can appear unlabelled.
export const FIELD_LABELS = {
  type: 'Dispatch type',
  name: 'Dispatch name',
  date: 'Date',
  startTime: 'Start time',
  endTime: 'End time',
  location: 'Venue address',
  venueNotes: 'Arrival notes',
  guestCount: 'Guest count',
  budget: 'Budget',
  vendor: 'Vendor',
  menuItems: 'Menu items',
  serviceStyle: 'Service style',
  dietaryNotes: 'Dietary notes',
  services: 'Services',
  staff: 'Staff',
  staffNotes: 'Notes for staff',
  rsvp: 'Guest RSVP',
  materials: 'Materials',
};
// Which builder step owns each field (used by Edit links and the coverage self-check).
export const FIELD_STEP = {
  type: 'basics', name: 'basics', date: 'basics', startTime: 'basics', endTime: 'basics',
  location: 'basics', venueNotes: 'basics', guestCount: 'basics', budget: 'basics',
  vendor: 'vendor', menuItems: 'food', serviceStyle: 'food', dietaryNotes: 'food',
  services: 'services', staff: 'staff', staffNotes: 'staff', rsvp: 'rsvp', materials: 'materials',
};

export const FULFILMENT = ['pending', 'accepted', 'preparing', 'en_route', 'delivered'];
export const FULFILMENT_LABEL = {
  pending: 'Awaiting vendor',
  accepted: 'Accepted',
  preparing: 'Preparing',
  en_route: 'Out for delivery',
  delivered: 'Delivered & set',
};

export const STAFF_STATUS_LABEL = {
  assigned: 'Assigned',
  confirmed: 'Confirmed',
  on_way: 'On the way',
  arrived: 'Arrived',
  completed: 'Shift complete',
};

// ---------------------------------------------------------------- people & vendors

export const USERS = [
  { id: 'u-maya', name: 'Maya Chen', email: 'maya.chen@example.com', kind: 'client', title: 'Client', phone: '(503) 555-0142' },
  { id: 'u-ava', name: 'Ava Laurent', email: 'ava@culinary.express', kind: 'lead_planner', title: 'Lead Planner · Cülinary Expréss', phone: '(503) 555-0110' },
  { id: 'u-noah', name: 'Noah Whitfield', email: 'noah.whitfield@example.com', kind: 'client', title: 'Groom-to-be', phone: '(503) 555-0187' },
  { id: 'u-grace', name: 'Grace Okoye', email: 'grace.okoye@example.com', kind: 'client', title: 'Executive Assistant, Northwind', phone: '(503) 555-0163' },
  // vendor contacts
  { id: 'u-bella', name: 'Bella Cucina', email: 'events@bellacucina.example', kind: 'vendor', title: 'Marco Bellini, events', phone: '(503) 555-0121', vendorId: 'v-bella' },
  { id: 'u-saffron', name: 'Saffron House', email: 'catering@saffronhouse.example', kind: 'vendor', title: 'Anjali Rao, catering', phone: '(503) 555-0122', vendorId: 'v-saffron' },
  { id: 'u-harbor', name: 'Harbor & Smoke', email: 'hello@harborandsmoke.example', kind: 'vendor', title: 'Cole Brennan, chef', phone: '(503) 555-0123', vendorId: 'v-harbor' },
  { id: 'u-verdant', name: 'Verdant Table', email: 'events@verdanttable.example', kind: 'vendor', title: 'Lucía Marín, owner', phone: '(503) 555-0124', vendorId: 'v-verdant' },
  { id: 'u-petal', name: 'Petal & Stem', email: 'studio@petalandstem.example', kind: 'vendor', title: 'Florist', phone: '(503) 555-0131', vendorId: 's-petal' },
  { id: 'u-linen', name: 'Linen & Lumber', email: 'rentals@linenandlumber.example', kind: 'vendor', title: 'Rentals', phone: '(503) 555-0132', vendorId: 's-linen' },
  { id: 'u-golden', name: 'Golden Hour Studio', email: 'book@goldenhour.example', kind: 'vendor', title: 'Photographer', phone: '(503) 555-0133', vendorId: 's-golden' },
  { id: 'u-velvet', name: 'Velvet Note Trio', email: 'booking@velvetnote.example', kind: 'vendor', title: 'Live music', phone: '(503) 555-0134', vendorId: 's-velvet' },
  // staff pool
  { id: 'u-diego', name: 'Diego Ramos', email: 'diego.ramos@example.com', kind: 'staff', title: 'Server', phone: '(503) 555-0151' },
  { id: 'u-sam', name: 'Sam Okafor', email: 'sam.okafor@example.com', kind: 'staff', title: 'Coordinator', phone: '(503) 555-0152' },
  { id: 'u-priya', name: 'Priya Nair', email: 'priya.nair@example.com', kind: 'staff', title: 'Bartender', phone: '(503) 555-0153' },
  { id: 'u-lena', name: 'Lena Fischer', email: 'lena.fischer@example.com', kind: 'staff', title: 'Server', phone: '(503) 555-0154' },
  { id: 'u-jules', name: 'Jules Moreau', email: 'jules.moreau@example.com', kind: 'staff', title: 'Sommelier', phone: '(503) 555-0155' },
  { id: 'u-tom', name: 'Tom Becker', email: 'tom.becker@example.com', kind: 'staff', title: 'Attendant', phone: '(503) 555-0156' },
  { id: 'u-rosa', name: 'Rosa Vidal', email: 'rosa.vidal@example.com', kind: 'staff', title: 'Server', phone: '(503) 555-0157' },
  { id: 'u-kai', name: 'Kai Andersen', email: 'kai.andersen@example.com', kind: 'staff', title: 'Cleaner', phone: '(503) 555-0158' },
  { id: 'u-ray', name: 'Ray Kim', email: 'ray.kim@example.com', kind: 'staff', title: 'Delivery', phone: '(503) 555-0159' },
  { id: 'u-mina', name: 'Mina Park', email: 'mina.park@example.com', kind: 'staff', title: 'Server', phone: '(503) 555-0160' },
  { id: 'u-noor', name: 'Noor Haddad', email: 'noor.haddad@example.com', kind: 'staff', title: 'Server', phone: '(503) 555-0161' },
  { id: 'u-ellis', name: 'Ellis Grant', email: 'ellis.grant@example.com', kind: 'staff', title: 'Server', phone: '(503) 555-0162' },
  { id: 'u-ana', name: 'Ana Souza', email: 'ana.souza@example.com', kind: 'staff', title: 'Bartender', phone: '(503) 555-0163' },
  { id: 'u-felix', name: 'Felix Wu', email: 'felix.wu@example.com', kind: 'staff', title: 'Server', phone: '(503) 555-0164' },
];

// Restaurant Vendor Pages. Menu prices are per guest portion unless `unit` says otherwise.
export const VENDORS = [
  {
    id: 'v-bella', userId: 'u-bella', name: 'Bella Cucina', cuisine: 'Italian trattoria',
    area: 'Pearl District', minGuests: 10, leadDays: 5, from: 38, photo: 'trattoria',
    about: 'Hand-rolled pasta, wood-fired mains and a dessert table people talk about.',
    tags: ['Vegetarian-friendly', 'Gluten-free options'],
    menu: [
      { id: 'm-burrata', name: 'Burrata, heirloom tomato & basil', price: 14, course: 'Starter' },
      { id: 'm-arancini', name: 'Wild mushroom arancini', price: 9, course: 'Starter' },
      { id: 'm-rigatoni', name: 'Rigatoni alla vodka', price: 17, course: 'Main' },
      { id: 'm-risotto', name: 'Lemon & pea risotto', price: 19, course: 'Main' },
      { id: 'm-milanese', name: 'Chicken Milanese', price: 24, course: 'Main' },
      { id: 'm-branzino', name: 'Branzino al limone', price: 29, course: 'Main' },
      { id: 'm-tiramisu', name: 'Tiramisu', price: 10, course: 'Dessert' },
      { id: 'm-focaccia', name: 'Rosemary focaccia', price: 4, course: 'Side' },
    ],
  },
  {
    id: 'v-saffron', userId: 'u-saffron', name: 'Saffron House', cuisine: 'Modern Indian',
    area: 'Division St', minGuests: 20, leadDays: 4, from: 32, photo: 'spice',
    about: 'Regional Indian cooking, built for sharing and buffets.',
    tags: ['Vegan options', 'Halal'],
    menu: [
      { id: 'm-chaat', name: 'Samosa chaat', price: 9, course: 'Starter' },
      { id: 'm-tikka', name: 'Paneer tikka', price: 15, course: 'Starter' },
      { id: 'm-butter', name: 'Butter chicken', price: 22, course: 'Main' },
      { id: 'm-rogan', name: 'Lamb rogan josh', price: 26, course: 'Main' },
      { id: 'm-dal', name: 'Dal makhani', price: 14, course: 'Main' },
      { id: 'm-naan', name: 'Garlic naan', price: 5, course: 'Side' },
      { id: 'm-kheer', name: 'Saffron kheer', price: 8, course: 'Dessert' },
    ],
  },
  {
    id: 'v-harbor', userId: 'u-harbor', name: 'Harbor & Smoke', cuisine: 'Coastal grill & smokehouse',
    area: 'Central Eastside', minGuests: 15, leadDays: 7, from: 44, photo: 'grill',
    about: 'Oysters, live-fire cooking and a raw bar that travels.',
    tags: ['Raw bar', 'Live-fire station'],
    menu: [
      { id: 'm-oysters', name: 'Oysters on ice, mignonette', price: 18, course: 'Starter' },
      { id: 'm-corn', name: 'Charred corn, chili butter', price: 7, course: 'Side' },
      { id: 'm-brisket', name: '14-hour smoked brisket', price: 26, course: 'Main' },
      { id: 'm-lobster', name: 'Lobster roll', price: 28, course: 'Main' },
      { id: 'm-greens', name: 'Charred greens, lemon', price: 9, course: 'Side' },
      { id: 'm-cobbler', name: 'Peach cobbler', price: 9, course: 'Dessert' },
    ],
  },
  {
    id: 'v-verdant', userId: 'u-verdant', name: 'Verdant Table', cuisine: 'Farm-to-table',
    area: 'Hawthorne', minGuests: 8, leadDays: 6, from: 41, photo: 'garden',
    about: 'Menus written each week from three partner farms. Local Farm Upgrade available.',
    tags: ['Local Farm Upgrade', 'Seasonal'],
    menu: [
      { id: 'm-crudites', name: 'Market crudités, green goddess', price: 10, course: 'Starter' },
      { id: 'm-beet', name: 'Roasted beets, whipped feta', price: 12, course: 'Starter' },
      { id: 'm-gnudi', name: 'Ricotta gnudi, brown butter', price: 21, course: 'Main' },
      { id: 'm-pork', name: 'Heritage pork chop, apple mostarda', price: 27, course: 'Main' },
      { id: 'm-roots', name: 'Roasted root vegetables', price: 9, course: 'Side' },
      { id: 'm-cake', name: 'Olive oil cake, poached pear', price: 9, course: 'Dessert' },
    ],
  },
];

// Service vendors offered as add-ons (flat package prices).
export const SERVICES = [
  { id: 's-petal', userId: 'u-petal', name: 'Petal & Stem', category: 'Florist', price: 650, detail: 'Table arrangements and a welcome piece' },
  { id: 's-linen', userId: 'u-linen', name: 'Linen & Lumber', category: 'Rentals', price: 480, detail: 'Farm tables, chairs, linens and delivery' },
  { id: 's-golden', userId: 'u-golden', name: 'Golden Hour Studio', category: 'Photographer', price: 1200, detail: '4 hours, edited gallery in 10 days' },
  { id: 's-velvet', userId: 'u-velvet', name: 'Velvet Note Trio', category: 'Music', price: 900, detail: 'Jazz trio, two 45-minute sets' },
];

export const userById = (id) => USERS.find((u) => u.id === id);
export const vendorById = (id) => VENDORS.find((v) => v.id === id);
export const serviceById = (id) => SERVICES.find((s) => s.id === id);

// ---------------------------------------------------------------- derived data

export const hoursBetween = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
};
export const addMinutes = (time, delta) => {
  const [h, m] = time.split(':').map(Number);
  let t = (h * 60 + m + delta) % (24 * 60);
  if (t < 0) t += 24 * 60;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

export const vendorName = (d) =>
  !d.vendor ? null : d.vendor.kind === 'page' ? vendorById(d.vendor.vendorId)?.name : d.vendor.name;

export const priceOf = (d, item) => {
  if (typeof item.price === 'number') return item.price;
  if (d.vendor?.kind === 'page') {
    const m = vendorById(d.vendor.vendorId)?.menu.find((x) => x.id === item.itemId);
    if (m) return m.price;
  }
  return null;
};

export const staffCount = (d) => (d.staff || []).reduce((n, s) => n + s.count, 0);

// Mock estimate. Rates: menu prices per portion, staff hourly for event hours + 1h setup,
// 8% platform fee, 8.25% tax on food and services, 30% deposit.
export function quoteFor(d) {
  const lines = [];
  const food = (d.menuItems || []).reduce((sum, it) => sum + (priceOf(d, it) || 0) * it.qty, 0);
  const unpriced = (d.menuItems || []).filter((it) => priceOf(d, it) == null && it.qty > 0).length;
  if (food > 0 || unpriced) lines.push({ label: `Food · ${vendorName(d) || 'Vendor'}`, amount: food, note: unpriced ? `${unpriced} item${unpriced > 1 ? 's' : ''} priced by vendor` : null });
  const services = (d.services || []).map((s) => serviceById(s.vendorId)).filter(Boolean);
  services.forEach((s) => lines.push({ label: `${s.category} · ${s.name}`, amount: s.price }));
  const hours = d.startTime && d.endTime ? hoursBetween(d.startTime, d.endTime) + 1 : 0;
  const staffCost = (d.staff || []).reduce((sum, s) => sum + s.count * (STAFF_RATE[s.role] || 0) * hours, 0);
  if (staffCost > 0) lines.push({ label: `Staff · ${staffCount(d)} people × ${hours} h`, amount: Math.round(staffCost) });
  if (d.type === 'catered_delivery') lines.push({ label: 'Delivery & setup', amount: 85 });
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const taxable = food + services.reduce((s, x) => s + x.price, 0);
  const fee = Math.round(subtotal * 0.08);
  const tax = Math.round(taxable * 0.0825);
  const total = subtotal + fee + tax;
  const deposit = Math.round(total * 0.3);
  return { lines, subtotal, fee, tax, total, deposit };
}

// Event run sheet, generated from type and times so it always matches the Ticket.
export function timelineFor(d) {
  if (!d.startTime || !d.endTime) return [];
  const s = d.startTime;
  const e = d.endTime;
  if (d.type === 'catered_delivery') {
    return [
      { time: addMinutes(s, -120), label: 'Kitchen prep begins', who: vendorName(d) },
      { time: addMinutes(s, -45), label: 'Driver departs with order', who: 'Delivery' },
      { time: addMinutes(s, -20), label: 'Drop-off and buffet set', who: vendorName(d) },
      { time: s, label: 'Food service opens', who: 'Guests' },
      { time: e, label: 'Pickup of serving ware', who: 'Delivery' },
    ];
  }
  return [
    { time: addMinutes(s, -120), label: 'Staff call time and briefing', who: 'All staff' },
    { time: addMinutes(s, -90), label: 'Vendor arrives, kitchen set', who: vendorName(d) },
    { time: addMinutes(s, -30), label: 'Room and bar ready, final walk-through', who: 'Coordinator' },
    { time: s, label: 'Guests arrive', who: 'Guests' },
    { time: addMinutes(s, 60), label: `${d.serviceStyle || 'Dinner'} service begins`, who: 'Servers' },
    { time: addMinutes(e, -30), label: 'Last call', who: 'Bar' },
    { time: e, label: 'Event ends', who: 'Guests' },
    { time: addMinutes(e, 60), label: 'Breakdown complete, venue handed back', who: 'All staff' },
  ];
}

export const callTimeFor = (d) => (d.startTime ? addMinutes(d.startTime, -120) : null);

export function defaultChecklist(d) {
  const items = [
    'Confirm shift with the coordinator',
    'Uniform: black shirt, black trousers, non-slip shoes',
    'Check in at the service entrance',
    'Join the briefing at call time',
  ];
  if (d.type !== 'catered_delivery') items.push(`Set tables for ${d.guestCount || 0} guests`, 'Polish glassware and check stations');
  if (d.dietaryNotes) items.push('Learn the dietary notes for your tables');
  items.push('Breakdown and hand back the venue');
  return items.map((text, i) => ({ id: `c${i}`, text, done: false }));
}

export function autopilotCheckpoints(d) {
  const staffAssigned = (d.staff || []).every((s) => (s.assigned || []).length >= s.count);
  return [
    { label: 'Menu and vendor confirmed', done: !!d.vendor && (d.menuItems || []).length > 0 },
    { label: 'Deposit received', done: !!d.quote?.paid },
    { label: 'Staff confirmed', done: d.type === 'catered_delivery' || (staffCount(d) > 0 && staffAssigned) },
    { label: 'Final headcount locked (5 days out)', done: ['live', 'completed'].includes(d.status) },
    { label: 'Run sheet sent to everyone', done: ['live', 'completed'].includes(d.status) },
  ];
}

// ---------------------------------------------------------------- seed

const iso = (date) => date.toISOString().slice(0, 10);
const dayOffset = (base, n) => {
  const x = new Date(base);
  x.setDate(x.getDate() + n);
  return iso(x);
};
const at = (base, n, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const x = new Date(base);
  x.setDate(x.getDate() + n);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
};

export function makeSeed() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const whitfield = {
    id: 'cx-1024', ticketNo: 'CX-1024', ownerId: 'u-maya', leadPlannerId: 'u-ava',
    name: 'Whitfield Rehearsal Dinner', type: 'catered_event', status: 'planning', photo: 'glasshouse',
    date: dayOffset(today, 17), startTime: '18:30', endTime: '22:30',
    location: 'The Glasshouse at Linden Park, 210 NW Linden Ave, Portland, OR',
    venueNotes: 'Load in from the north lot. Freight door is beside the greenhouse.',
    guestCount: 60, budget: 12000,
    vendor: { kind: 'page', vendorId: 'v-bella' },
    menuItems: [
      { itemId: 'm-burrata', name: 'Burrata, heirloom tomato & basil', qty: 60 },
      { itemId: 'm-rigatoni', name: 'Rigatoni alla vodka', qty: 30 },
      { itemId: 'm-branzino', name: 'Branzino al limone', qty: 30 },
      { itemId: 'm-tiramisu', name: 'Tiramisu', qty: 60 },
    ],
    serviceStyle: 'Family style', dietaryNotes: '4 vegetarian, 2 gluten-free, 1 shellfish allergy (table 3).',
    services: [{ vendorId: 's-petal', category: 'Florist' }, { vendorId: 's-velvet', category: 'Music' }],
    staff: [
      { role: 'Coordinator', count: 1, assigned: [] },
      { role: 'Server', count: 4, assigned: [] },
      { role: 'Bartender', count: 1, assigned: [] },
    ],
    staffNotes: 'Toasts begin at 7:45 PM. Hold mains until the last toast ends.',
    rsvp: {
      enabled: true,
      guests: [
        { name: 'Eleanor Whitfield', email: 'eleanor.w@example.com', status: 'yes' },
        { name: 'James Whitfield', email: 'james.w@example.com', status: 'yes' },
        { name: 'Harper Lin', email: 'harper.lin@example.com', status: 'yes' },
        { name: 'Owen Price', email: 'owen.price@example.com', status: 'pending' },
        { name: 'Sofia Alvarez', email: 'sofia.alvarez@example.com', status: 'yes' },
        { name: 'Ben Carter', email: 'ben.carter@example.com', status: 'no' },
        { name: 'Isla Murray', email: 'isla.murray@example.com', status: 'pending' },
      ],
    },
    materials: [
      { item: 'Tables', providedBy: 'vendor' }, { item: 'Chairs', providedBy: 'vendor' },
      { item: 'Linens', providedBy: 'us' }, { item: 'Plates', providedBy: 'vendor' },
      { item: 'Cutlery', providedBy: 'vendor' }, { item: 'Glassware', providedBy: 'vendor' },
      { item: 'Centerpieces', providedBy: 'us' },
    ],
    quote: null, fulfilment: 'accepted',
    participants: [
      { userId: 'u-maya', role: 'owner', permission: 'edit' },
      { userId: 'u-ava', role: 'lead_planner', permission: 'edit' },
      { userId: 'u-bella', role: 'vendor', permission: 'suggest' },
      { userId: 'u-noah', role: 'co_planner', permission: 'edit' },
    ],
    linkAccess: 'invited_only',
    autopilot: { enabled: true },
    suggestions: [],
    checklist: null, staffStatus: {},
    draftStep: 'staff',
    activity: [
      { at: at(today, -6, '10:12'), by: 'u-maya', kind: 'create', text: 'Created the Dispatch' },
      { at: at(today, -6, '10:20'), by: 'u-maya', kind: 'edit', text: 'Chose Bella Cucina from Vendor Pages' },
      { at: at(today, -5, '16:02'), by: 'u-maya', kind: 'share', text: 'Invited Noah Whitfield as Co-planner · Can edit' },
      { at: at(today, -4, '09:31'), by: 'u-ava', kind: 'edit', text: 'Turned on Autopilot' },
      { at: at(today, -2, '14:45'), by: 'u-noah', kind: 'edit', text: 'Service style: Plated → Family style' },
    ],
  };

  const northwind = {
    id: 'cx-1019', ticketNo: 'CX-1019', ownerId: 'u-maya', leadPlannerId: 'u-ava',
    name: 'Northwind Q4 Leadership Lunch', type: 'onsite_booking', status: 'live', photo: 'loft',
    date: dayOffset(today, 0), startTime: '12:30', endTime: '15:30',
    location: 'Northwind Studios, 48 SE Mercer St, Floor 5, Portland, OR',
    venueNotes: 'Service elevator at the back of the lobby. Ask security for a Floor 5 badge.',
    guestCount: 40, budget: 7500,
    vendor: { kind: 'page', vendorId: 'v-harbor' },
    menuItems: [
      { itemId: 'm-oysters', name: 'Oysters on ice, mignonette', qty: 40 },
      { itemId: 'm-brisket', name: '14-hour smoked brisket', qty: 25 },
      { itemId: 'm-lobster', name: 'Lobster roll', qty: 15 },
      { itemId: 'm-corn', name: 'Charred corn, chili butter', qty: 40 },
      { itemId: 'm-cobbler', name: 'Peach cobbler', qty: 40 },
    ],
    serviceStyle: 'Stations', dietaryNotes: '3 vegetarian (corn and greens doubled). No pork.',
    services: [{ vendorId: 's-golden', category: 'Photographer' }],
    staff: [
      { role: 'Coordinator', count: 1, assigned: ['u-sam'] },
      { role: 'Server', count: 2, assigned: ['u-diego', 'u-lena'] },
      { role: 'Bartender', count: 1, assigned: ['u-priya'] },
    ],
    staffNotes: 'CEO keynote runs 1:00 to 1:30 PM. Keep stations quiet and pause clearing during the talk.',
    rsvp: {
      enabled: true,
      guests: [
        { name: 'Grace Okoye', email: 'grace.okoye@example.com', status: 'yes' },
        { name: 'Daniel Osei', email: 'daniel.osei@example.com', status: 'yes' },
        { name: 'Emma Novak', email: 'emma.novak@example.com', status: 'yes' },
        { name: 'Liam Turner', email: 'liam.turner@example.com', status: 'yes' },
        { name: 'Chloe Martin', email: 'chloe.martin@example.com', status: 'no' },
      ],
    },
    materials: [],
    quote: { paid: true, paidAt: at(today, -12, '11:04') }, fulfilment: 'delivered',
    participants: [
      { userId: 'u-maya', role: 'owner', permission: 'edit' },
      { userId: 'u-ava', role: 'lead_planner', permission: 'edit' },
      { userId: 'u-harbor', role: 'vendor', permission: 'suggest' },
      { userId: 'u-grace', role: 'co_planner', permission: 'edit' },
    ],
    linkAccess: 'invited_only',
    autopilot: { enabled: true },
    suggestions: [],
    checklist: null,
    staffStatus: { 'u-sam': 'arrived', 'u-priya': 'arrived', 'u-lena': 'on_way', 'u-diego': 'confirmed' },
    activity: [
      { at: at(today, -20, '09:00'), by: 'u-maya', kind: 'create', text: 'Created the Dispatch' },
      { at: at(today, -12, '11:04'), by: 'u-maya', kind: 'payment', text: 'Paid the deposit (mock checkout)' },
      { at: at(today, -12, '11:05'), by: 'u-ava', kind: 'status', text: 'Status: Quoted → Confirmed' },
      { at: at(today, -3, '15:20'), by: 'u-harbor', kind: 'suggest', text: 'Suggested Guest count: 45 → 40' },
      { at: at(today, -3, '17:02'), by: 'u-maya', kind: 'accept', text: 'Accepted suggestion · Guest count: 45 → 40' },
      { at: at(today, 0, '09:15'), by: 'u-ava', kind: 'status', text: 'Status: Confirmed → Live' },
      { at: at(today, 0, '10:05'), by: 'u-harbor', kind: 'status', text: 'Fulfilment: Delivered & set' },
      { at: at(today, 0, '10:22'), by: 'u-sam', kind: 'status', text: 'Sam Okafor: Arrived' },
      { at: at(today, 0, '10:31'), by: 'u-priya', kind: 'status', text: 'Priya Nair: Arrived' },
      { at: at(today, 0, '10:40'), by: 'u-lena', kind: 'status', text: 'Lena Fischer: On the way' },
    ],
  };

  const alder = {
    id: 'cx-1007', ticketNo: 'CX-1007', ownerId: 'u-maya', leadPlannerId: 'u-ava',
    name: 'Alder & Finch Launch Night', type: 'catered_delivery', status: 'completed', photo: 'buffet',
    date: dayOffset(today, -19), startTime: '17:00', endTime: '20:00',
    location: 'Alder & Finch, 900 NW Harbor Blvd, Portland, OR',
    venueNotes: 'Deliver to the loading bay on 9th. Ask for Priyanka at reception.',
    guestCount: 120, budget: 6000,
    vendor: { kind: 'page', vendorId: 'v-saffron' },
    menuItems: [
      { itemId: 'm-chaat', name: 'Samosa chaat', qty: 120 },
      { itemId: 'm-butter', name: 'Butter chicken', qty: 70 },
      { itemId: 'm-dal', name: 'Dal makhani', qty: 50 },
      { itemId: 'm-naan', name: 'Garlic naan', qty: 120 },
    ],
    serviceStyle: 'Buffet', dietaryNotes: 'Label vegan and nut-free trays.',
    services: [], staff: [], staffNotes: '',
    rsvp: { enabled: false, guests: [] }, materials: [],
    quote: { paid: true, paidAt: at(today, -30, '13:10') }, fulfilment: 'delivered',
    participants: [
      { userId: 'u-maya', role: 'owner', permission: 'edit' },
      { userId: 'u-ava', role: 'lead_planner', permission: 'edit' },
      { userId: 'u-saffron', role: 'vendor', permission: 'suggest' },
    ],
    linkAccess: 'invited_only',
    autopilot: { enabled: false },
    suggestions: [], checklist: null, staffStatus: {},
    activity: [
      { at: at(today, -32, '10:00'), by: 'u-maya', kind: 'create', text: 'Created the Dispatch' },
      { at: at(today, -30, '13:10'), by: 'u-maya', kind: 'payment', text: 'Paid the deposit (mock checkout)' },
      { at: at(today, -19, '16:42'), by: 'u-saffron', kind: 'status', text: 'Fulfilment: Delivered & set' },
      { at: at(today, -18, '09:00'), by: 'u-ava', kind: 'status', text: 'Status: Live → Completed' },
    ],
  };

  const threads = {
    'cx-1024': [
      { at: at(today, -5, '09:12'), by: 'u-ava', text: "Hi Maya, I'm your Lead Planner for the rehearsal dinner. I'll keep the checkpoints moving and flag anything that needs you." },
      { at: at(today, -5, '09:40'), by: 'u-maya', text: 'Thank you! The family-style idea came from Noah, we love it.' },
      { at: at(today, -3, '18:05'), by: 'u-bella', text: 'Family style works well for 60. We will send platters in two waves so tables stay full.' },
      { at: at(today, -1, '11:30'), by: 'u-ava', text: 'Staff is the last open step. Once the deposit is in, I assign the team within a day.' },
    ],
    'cx-1019': [
      { at: at(today, 0, '09:20'), by: 'u-ava', text: 'Good morning! Everything is on track for 12:30. Harbor & Smoke is loading now.' },
      { at: at(today, 0, '10:07'), by: 'u-harbor', text: 'Stations are set on Floor 5. Oysters go out at 12:15.' },
      { at: at(today, 0, '10:24'), by: 'u-sam', text: 'On site. Badges collected for the team at security.' },
    ],
    'cx-1007': [
      { at: at(today, -19, '16:45'), by: 'u-saffron', text: 'Delivered and set. Vegan trays are on the left end.' },
      { at: at(today, -19, '20:30'), by: 'u-maya', text: 'Everyone loved it. Thank you!' },
    ],
  };

  return {
    version: 3,
    session: { role: 'client', userId: 'u-maya', lastDispatchId: 'cx-1024', signupRole: 'client', hideSeeds: false },
    dispatches: [whitfield, northwind, alder],
    threads,
    nextTicket: 1031,
  };
}

// The "Party" inquiry from today's app, rebuilt as a Dispatch for the Compare screen.
// Values come from the attached screenshots of the current inquiry form and dispatch page.
export function makeCompareDispatch() {
  return {
    id: 'compare', ticketNo: 'CX-0616', ownerId: 'u-maya', leadPlannerId: 'u-ava',
    name: 'Party', type: 'catered_event', status: 'inquiry', photo: 'glasshouse',
    date: '2026-10-28', startTime: '00:30', endTime: '06:00', location: 'Germany', venueNotes: '',
    guestCount: 100, budget: null,
    vendor: { kind: 'manual', name: 'Not chosen yet', contact: '' },
    menuItems: [{ name: 'Tasty', qty: 100 }],
    serviceStyle: 'Plated', dietaryNotes: '',
    services: [], staff: [{ role: 'Server', count: 5, assigned: [] }], staffNotes: 'test',
    rsvp: { enabled: false, guests: [] }, materials: [],
    quote: null, fulfilment: 'pending',
    participants: [
      { userId: 'u-maya', role: 'owner', permission: 'edit' },
      { userId: 'u-ava', role: 'lead_planner', permission: 'edit' },
    ],
    linkAccess: 'invited_only', autopilot: { enabled: false }, suggestions: [], checklist: null, staffStatus: {},
    activity: [{ at: '2026-10-07T05:24:00.000Z', by: 'u-maya', kind: 'create', text: 'Created the Dispatch from the inquiry form' }],
  };
}
