// ILOVA BELGISI (screen lAk24): the phone's home-screen icon. Asosiy is the app's own icon; the others are alternate icons
// that app.json registers through the expo-alternate-app-icons plugin (copies of the current icon until their art lands
// in assets/icons/). The native part needs a new build: on a build without it this does nothing. The package is loaded only
// here, when an icon is picked, because loading it on a build without its native module throws.

/** Catalogue id (data/cosmetics.ts appIcons) to the alternate icon's name in app.json; null is the app's own icon. */
const ICON_NAMES: Record<string, string | null> = { main: null, doppi: "Doppi", gold: "Gold", night: "Night" };

/** Puts icon `id` on the home screen when it is not there already. */
export async function applyAppIcon(id: string) {
  try {
    const icons = await import("expo-alternate-app-icons");
    if (!icons.supportsAlternateIcons) return;
    const name = ICON_NAMES[id] ?? null;
    if (icons.getAppIconName() === name) return;
    await icons.setAlternateAppIcon(name);
  } catch {
    // an older build without the native module, or the phone refused: the icon stays as it is
  }
}
