import { Directory,File,Paths } from "expo-file-system";

/** Only our private voice/feedback files and profile pictures, never bundled assets or shared storage. */
export function clearPrivateFiles() {
  const voices = new Directory(Paths.document, "voice");
  if (voices.exists) voices.delete();
  const profile = new Directory(Paths.document, "profile");
  if (profile.exists) profile.delete();
  for (const item of new Directory(Paths.document).list())
    if (item instanceof File && /^feedback-\d+\.png$/.test(item.name)) item.delete();
}
