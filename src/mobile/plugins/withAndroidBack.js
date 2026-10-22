const { withMainActivity } = require("expo/config-plugins");

// RN 0.86 registers its AndroidX Back callback on Android 16+, but Android
// 13–15 also require one when predictiveBackGestureEnabled is true.
function applyBackBridge(source) {
  const marker = "// Akademiya: Android 13-15 Back bridge.";
  if (source.includes(marker)) return source;
  const declaration = "class MainActivity : ReactActivity() {";
  const creation = "super.onCreate(null)";
  const method = "override fun invokeDefaultOnBackPressed() {";
  if (![declaration, creation, method].every(value => source.includes(value))) {
    throw new Error("withAndroidBack: MainActivity template changed; review the Back bridge.");
  }
  source = source.replace("import android.os.Bundle", "import android.os.Bundle\nimport androidx.activity.OnBackPressedCallback");
  source = source.replace(declaration, `${declaration}
  ${marker}
  private var akademiyaBackCallback: OnBackPressedCallback? = null
`);
  source = source.replace(creation, `${creation}
    if (Build.VERSION.SDK_INT >= 33 && Build.VERSION.SDK_INT < 36) {
      val callback = object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          isEnabled = false
          try {
            this@MainActivity.onBackPressed()
          } finally {
            isEnabled = true
          }
        }
      }
      akademiyaBackCallback = callback
      onBackPressedDispatcher.addCallback(this, callback)
    }`);
  const begin = source.indexOf(method);
  const opening = source.indexOf("{", begin);
  let depth = 1, end = opening + 1;
  while (depth > 0 && end < source.length) {
    if (source[end] === "{") depth++;
    if (source[end] === "}") depth--;
    end++;
  }
  if (depth) throw new Error("withAndroidBack: cannot locate default Back handler.");
  const body = source.slice(opening + 1, end - 1);
  // A JS Home exit invokes the default handler asynchronously. Temporarily
  // disable our callback so that exit does not recursively re-enter JS.
  return source.slice(0, opening + 1) + `
    val callback = akademiyaBackCallback
    callback?.isEnabled = false
    try {${body}
    } finally {
      callback?.isEnabled = true
    }
  }` + source.slice(end);
}

module.exports = config => withMainActivity(config, config => {
  if (config.modResults.language !== "kt") throw new Error("withAndroidBack requires Kotlin MainActivity");
  config.modResults.contents = applyBackBridge(config.modResults.contents);
  return config;
});
module.exports.applyBackBridge = applyBackBridge;
