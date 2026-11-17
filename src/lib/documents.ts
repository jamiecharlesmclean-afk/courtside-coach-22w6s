// Document library: links to the team's files (forms, schedules, policies) and notes about them.
// A document can hold a link and/or a file (up to 5 MB) kept as a data URL on this device.
import type { Base } from "@/lib/store";

export const DOCUMENTS_KEY = "courtside:documents";

export const DOCUMENT_CATEGORIES = [
  "Forms & consents",
  "Schedules",
  "Policies",
  "Handouts",
  "Team info",
  "Other",
] as const;

export type Document = Base & {
  title: string;
  category: string;
  link: string;
  notes: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_data: string;
};

export type DocumentDraft = Omit<Document, keyof Base>;

export const emptyDocumentDraft: DocumentDraft = {
  title: "",
  category: DOCUMENT_CATEGORIES[0],
  link: "",
  notes: "",
  file_name: "",
  file_type: "",
  file_size: 0,
  file_data: "",
};
