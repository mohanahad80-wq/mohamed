import { District } from "@/generated/prisma/client";

export const DISTRICT_LABELS: Record<District, string> = {
  HODAN: "Hodan",
  WADAJIR: "Wadajir",
  KARAAN: "Karaan",
  HAMAR_WEYNE: "Hamar Weyne",
  HAMAR_JABJAB: "Hamar Jabjab",
  BONDHERE: "Bondhere",
  WARDHIIGLEY: "Wardhiigley",
  YAQSHID: "Yaqshid",
  SHIBIS: "Shibis",
  DAYNIILE: "Dayniile",
  HAWL_WADAAG: "Hawl Wadaag",
  SHANGANI: "Shangani",
  WAABERI: "Waaberi",
  ABDIAZIZ: "Abdiaziz",
  WARTA_NABADA: "Warta Nabada",
  DHARKENLEY: "Dharkenley",
  KAXDA: "Kaxda",
  HELIWAA: "Heliwaa",
};

export const DISTRICTS = Object.keys(DISTRICT_LABELS) as District[];
