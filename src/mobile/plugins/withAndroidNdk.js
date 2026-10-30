const {
  withProjectBuildGradle,
  withAndroidManifest,
} = require("expo/config-plugins");

// Rive 0.5.4 omits android.ndkVersion, so Gradle otherwise selects its own
// default NDK instead of the version Expo uses for the other native modules.
module.exports = function withAndroidNdk(config) {
  config = withAndroidManifest(config, (config) => {
    // The internal build reaches PocketBase and Whisper on the owner's LAN.
    const application = config.modResults.manifest.application?.[0];
    if (application) application.$["android:usesCleartextTraffic"] = process.env.EXPO_PUBLIC_INTERNAL_BUILD === "1" ? "true" : "false";
    return config;
  });
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withAndroidNdk requires a Groovy project build.gradle");
    }

    const marker = "// Akademiya: align native libraries with the Expo NDK.";
    config.modResults.contents = config.modResults.contents.replace(/\n\/\/ Akademiya: align native libraries with the Expo NDK\.\nsubprojects \{[\s\S]*?\n\}\n/, '\n');
    config.modResults.contents += `
${marker}
subprojects { subproject ->
  ["com.android.library", "com.android.application"].each { androidPlugin ->
    subproject.plugins.withId(androidPlugin) {
      subproject.android.ndkVersion = rootProject.ext.ndkVersion
      // Bound native compiler/linker concurrency on the shared development PC.
      subproject.android.defaultConfig.externalNativeBuild.cmake.arguments.addAll([
        "-DCMAKE_JOB_POOLS=akademiya_compile=2;akademiya_link=1",
        "-DCMAKE_JOB_POOL_COMPILE=akademiya_compile",
        "-DCMAKE_JOB_POOL_LINK=akademiya_link"
      ])
    }
  }
}
`;
    return config;
  });
};
