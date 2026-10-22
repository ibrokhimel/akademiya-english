import { serviceURL } from "./releasePolicy";
import { visualAuditEnabled } from "./visualAudit";

export const internalBuild = process.env.EXPO_PUBLIC_INTERNAL_BUILD === "1";
export const testToolsEnabled = internalBuild || visualAuditEnabled;
export const backendURL = serviceURL(process.env.EXPO_PUBLIC_API_URL, internalBuild);
export const speechURL = serviceURL(process.env.EXPO_PUBLIC_SPEECH_URL, internalBuild);
export const cloudEnabled = !!backendURL;
export const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "";
