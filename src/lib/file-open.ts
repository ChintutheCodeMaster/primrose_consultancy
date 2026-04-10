import { toast } from "sonner";

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const PREVIEWABLE_TYPES = ["application/pdf"];

const GOOGLE_DOCS_VIEWABLE_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function isGoogleDocsViewable(mimeType: string) {
  return GOOGLE_DOCS_VIEWABLE_TYPES.includes(mimeType);
}

function getExtension(url: string) {
  const cleanUrl = url.split("?")[0].split("#")[0];
  return cleanUrl.split(".").pop()?.toLowerCase() || "";
}

function getMimeType(url: string, fallback?: string | null) {
  const extension = getExtension(url);
  return MIME_TYPES[extension] || fallback || "application/octet-stream";
}

function getFileName(url: string, fallback?: string) {
  const cleanUrl = url.split("?")[0].split("#")[0];
  const name = cleanUrl.split("/").pop();
  return name || fallback || "file";
}

function isPreviewable(mimeType: string) {
  return mimeType.startsWith("image/") || PREVIEWABLE_TYPES.includes(mimeType);
}

function clickLink(href: string, options?: { download?: string; target?: "_blank" }) {
  const link = document.createElement("a");
  link.href = href;
  if (options?.download) link.download = options.download;
  if (options?.target) {
    link.target = options.target;
    link.rel = "noopener noreferrer";
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function openExternalFile(url: string, fallbackName?: string) {
  if (!url) {
    toast.error("לא נמצא קובץ לפתיחה");
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);

    const mimeType = getMimeType(url, response.headers.get("content-type"));
    const fileName = getFileName(url, fallbackName);
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);

    if (isPreviewable(mimeType)) {
      clickLink(objectUrl, { target: "_blank" });
    } else {
      clickLink(objectUrl, { download: fileName });
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    console.error("Failed to open file", error);
    try {
      clickLink(url, { target: "_blank" });
    } catch {
      toast.error("לא הצלחנו לפתוח את הקובץ");
    }
  }
}
