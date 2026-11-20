// Device pickers for the team logo (photo library) and document files.
// Files are kept inside the app's local data as data URLs, so the size is capped.
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export async function pickLogo(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("Allow photo access in your device settings to choose a logo.");
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  if (!asset.base64) throw new Error("That photo could not be read. Try another.");
  return `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;
}

export type PickedFile = { name: string; type: string; size: number; data: string };

export async function pickDocumentFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  const size = asset.size ?? 0;
  if (size > MAX_DOCUMENT_BYTES) {
    throw new Error("That file is larger than 5 MB. Choose a smaller file, or paste a link instead.");
  }
  const blob = await (await fetch(asset.uri)).blob();
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("That file could not be read. Try another."));
    reader.readAsDataURL(blob);
  });
  return { name: asset.name, type: asset.mimeType ?? blob.type ?? "application/octet-stream", size, data };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
