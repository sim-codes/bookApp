const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withDesugaring(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Add coreLibraryDesugaringEnabled inside compileOptions
    if (!contents.includes('coreLibraryDesugaringEnabled true')) {
      contents = contents.replace(
        /compileOptions\s*\{/,
        `compileOptions {\n        coreLibraryDesugaringEnabled true`
      );
    }

    // Add the desugar_jdk_libs dependency
    if (!contents.includes('desugar_jdk_libs')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};
