import { Directory,File,Paths } from "expo-file-system";

/** Only our private voice/feedback files, never bundled assets or shared storage. */
export function clearPrivateFiles() {
  const voices = new Directory(Paths.document, "voice");
  if (voices.exists) voices.delete();
  for (const item of new Directory(Paths.document).list())
    if (item instanceof File && /^feedback-\d+\.png$/.test(item.name)) item.delete();
}
