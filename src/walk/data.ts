// All copy, picture sizes, clickable shapes and clip files for the walkthrough.
// Shapes and labels are in percent of the picture's own box (not the window).

export type FloorId = 1 | 2;
export type RoomId =
  | "collection"
  | "makerspace"
  | "computers"
  | "welcome"
  | "study"
  | "lounge"
  | "community";
export type Pic = { src: string; w: number; h: number };
export type Pt = [number, number];

export const EXTERIOR: Pic = { src: "walk/img/exterior.webp", w: 2688, h: 1520 };
export const LOGO = "walk/img/logo.png";

export const BUILDING_COPY = {
  kicker: "PUBLIC LIBRARY & TECHNOLOGY CENTER",
  headline: "Find your space at Branch.",
  hint: "Choose a floor.",
};

export type Band = {
  floor: FloorId;
  rect: [number, number, number, number]; // x, y, w, h in %
  kicker: string;
  title: string;
  body: string;
};

// Two invisible bands over the two storeys of glass in the exterior still.
export const BANDS: Band[] = [
  {
    floor: 2,
    rect: [7.6, 23.6, 84.8, 27.6],
    kicker: "FLOOR 2",
    title: "Study & community",
    body: "Quiet study rooms, reading lounge, community room",
  },
  {
    floor: 1,
    rect: [7.6, 54.8, 84.8, 30.2],
    kicker: "FLOOR 1",
    title: "Collections & makerspace",
    body: "Books, 3D printing, computers, welcome desk",
  },
];

export type SmallLabel = { id: "restrooms" | "stairs" | "other"; text: string; at: Pt };

export const FLOORS: Record<FloorId, { name: string; pic: Pic; rooms: RoomId[]; small: SmallLabel[] }> = {
  1: {
    name: "Floor 1",
    pic: { src: "walk/img/floor1.webp", w: 2688, h: 1520 },
    rooms: ["collection", "makerspace", "computers", "welcome"],
    small: [
      { id: "restrooms", text: "Restrooms", at: [22.9, 34.0] },
      { id: "stairs", text: "Stairs & lift", at: [18.8, 40.2] },
      { id: "other", text: "Open seating", at: [59.9, 63.9] },
      { id: "other", text: "Main entrance", at: [29.6, 48.8] },
    ],
  },
  2: {
    name: "Floor 2",
    pic: { src: "walk/img/floor2.webp", w: 2688, h: 1520 },
    rooms: ["study", "lounge", "community"],
    small: [
      { id: "restrooms", text: "Restrooms", at: [22.9, 34.0] },
      { id: "stairs", text: "Stairs & lift", at: [18.8, 40.2] },
      { id: "other", text: "Upper gallery", at: [50.9, 36.6] },
    ],
  },
};

export type Room = {
  floor: FloorId;
  pic: Pic;
  shape: Pt[];
  label: Pt;
  kicker: string;
  title: string;
  fact: string;
  sample: boolean;
};

// Generated room stills are 2688x1520; reference stand-ins (until their still exists) are 2560x1440.
const ROOM_PIC = (n: string, w = 2688, h = 1520): Pic => ({ src: `walk/img/${n}.webp`, w, h });

export const ROOMS: Record<RoomId, Room> = {
  collection: {
    floor: 1,
    pic: ROOM_PIC("collection"),
    shape: [[23.7, 27.7], [34.3, 12.4], [57.1, 22.1], [57.0, 25.5], [49.0, 44.3], [24.1, 31.2]],
    label: [40.8, 24.5],
    kicker: "FLOOR 1 · COLLECTIONS",
    title: "Book collections",
    fact: "Five shelves: Fiction, Sci-Fi & Fantasy, History, Engineering & Tech, Medicine & Health.",
    sample: false,
  },
  makerspace: {
    floor: 1,
    pic: ROOM_PIC("makerspace"),
    shape: [[54.8, 38.5], [54.8, 34.9], [58.8, 25.3], [82.8, 35.8], [82.3, 39.4], [80.1, 51.0]],
    label: [68.8, 35.0],
    kicker: "FLOOR 1 · TECHNOLOGY & MAKERSPACE",
    title: "3D printing & print",
    fact: "4 3D printers, 2 free now. Printing from $0.10 a page. Scanning is free.",
    sample: true,
  },
  computers: {
    floor: 1,
    pic: ROOM_PIC("computers"),
    shape: [[49.5, 48.0], [54.7, 35.3], [80.6, 47.7], [80.0, 51.4], [77.1, 66.9], [49.5, 51.7]],
    label: [65.1, 47.4],
    kicker: "FLOOR 1 · TECHNOLOGY & MAKERSPACE",
    title: "CAD & everyday computers",
    fact: "4 CAD workstations, 3 free now. 6 everyday PCs, 4 free now.",
    sample: true,
  },
  welcome: {
    floor: 1,
    pic: ROOM_PIC("welcome"),
    shape: [[23.1, 47.1], [29.5, 36.4], [41.7, 42.9], [41.8, 46.6], [36.2, 58.5], [23.6, 50.8]],
    label: [32.5, 44.6],
    kicker: "FLOOR 1 · START HERE",
    title: "Welcome desk",
    fact: "Library cards, directions and workshop sign-up.",
    sample: false,
  },
  study: {
    floor: 2,
    pic: ROOM_PIC("study"),
    shape: [[27.3, 22.6], [34.3, 12.4], [83.7, 33.5], [83.2, 37.1], [80.4, 52.2], [27.6, 26.0]],
    label: [54.2, 27.4],
    kicker: "FLOOR 2 · STUDY & COMMUNITY",
    title: "Quiet study rooms",
    fact: "4 rooms, 2 free now. Whiteboard, screen and power in each.",
    sample: true,
  },
  lounge: {
    floor: 2,
    pic: ROOM_PIC("lounge"),
    shape: [[23.5, 43.3], [31.6, 30.0], [49.0, 38.8], [49.0, 42.4], [42.4, 57.9], [23.9, 47.0]],
    label: [36.4, 40.6],
    kicker: "FLOOR 2 · STUDY & COMMUNITY",
    title: "Reading lounge",
    fact: "Comfortable seating for quiet reading.",
    sample: false,
  },
  community: {
    floor: 2,
    pic: ROOM_PIC("community", 2560, 1440),
    shape: [[45.6, 56.0], [52.1, 40.3], [79.9, 54.3], [79.3, 58.1], [75.7, 77.6], [45.7, 59.8]],
    label: [62.8, 54.8],
    kicker: "FLOOR 2 · STUDY & COMMUNITY",
    title: "Community room",
    fact: "Talks, group sessions and library programs.",
    sample: false,
  },
};

export type WhereTo =
  | { label: string; room: RoomId }
  | { label: string; spot: "restrooms" | "stairs" };

export const WHERE_TO: WhereTo[] = [
  { label: "3D printers", room: "makerspace" },
  { label: "Printing and scanning", room: "makerspace" },
  { label: "CAD workstations", room: "computers" },
  { label: "Everyday computers", room: "computers" },
  { label: "Books", room: "collection" },
  { label: "Help desk and library cards", room: "welcome" },
  { label: "Quiet study rooms", room: "study" },
  { label: "Reading lounge", room: "lounge" },
  { label: "Community room", room: "community" },
  { label: "Restrooms", spot: "restrooms" },
  { label: "Stairs & lift", spot: "stairs" },
];

// Fly-in clips, keyed "<from>-<to>". Each has a forward file and a reversed
// copy for going back. A missing clip falls back to a 300 ms crossfade.
export const CLIPS: Record<string, { fwd: string; rev: string } | undefined> = {};

// The printed "Where to?" directory sign (the user's own design), shown as a
// clickable sign. Hit areas are in percent of the sign image.
export type SignEntry = {
  label: string;
  rect: [number, number, number, number]; // x, y, w, h in %
  to: { room: RoomId } | { spot: "restrooms" | "stairs"; floor: FloorId };
};

export const SIGN = {
  src: "walk/img/directory-sign.png",
  w: 548,
  h: 656,
  alt: "Directory sign. You are here: Main entrance. Where to?",
  entries: [
    { label: "Help desk", rect: [4, 22.6, 92, 6.6], to: { room: "welcome" } },
    { label: "Book collections", rect: [4, 30.0, 92, 6.6], to: { room: "collection" } },
    { label: "Technology Center", rect: [4, 37.6, 92, 6.6], to: { room: "computers" } },
    { label: "Restrooms", rect: [4, 45.2, 92, 6.6], to: { spot: "restrooms", floor: 1 } },
    { label: "Stairs & lift", rect: [4, 52.8, 92, 6.6], to: { spot: "stairs", floor: 1 } },
    { label: "Quiet study rooms", rect: [4, 66.9, 92, 6.6], to: { room: "study" } },
    { label: "Reading lounge", rect: [4, 74.5, 92, 6.6], to: { room: "lounge" } },
    { label: "Community room", rect: [4, 82.3, 92, 6.6], to: { room: "community" } },
  ] as SignEntry[],
};
