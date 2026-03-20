const {
  withAppBuildGradle,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const DESUGARING_DEPENDENCY =
  'coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.1.2"';

const ensureDesugaringCompileOptions = (contents) => {
  if (contents.includes('coreLibraryDesugaringEnabled true')) {
    return contents;
  }

  const compileOptionsMatch = contents.match(/compileOptions\s*{[\s\S]*?}/);
  if (compileOptionsMatch) {
    return contents.replace(
      compileOptionsMatch[0],
      compileOptionsMatch[0].replace(
        /compileOptions\s*{/,
        'compileOptions {\n        coreLibraryDesugaringEnabled true',
      ),
    );
  }

  return contents.replace(
    /android\s*{/,
    'android {\n    compileOptions {\n        coreLibraryDesugaringEnabled true\n    }',
  );
};

const ensureDesugaringDependency = (contents) => {
  if (contents.includes(DESUGARING_DEPENDENCY)) {
    return contents;
  }
  return contents.replace(
    /dependencies\s*{/,
    `dependencies {\n    ${DESUGARING_DEPENDENCY}`,
  );
};

const withAndroidDesugaring = (config) =>
  withAppBuildGradle(config, (configProps) => {
    if (configProps.modResults.language !== 'groovy') {
      return configProps;
    }

    let contents = configProps.modResults.contents;
    contents = ensureDesugaringCompileOptions(contents);
    contents = ensureDesugaringDependency(contents);
    configProps.modResults.contents = contents;
    return configProps;
  });

module.exports = createRunOncePlugin(
  withAndroidDesugaring,
  'with-android-desugaring',
  '1.0.0',
);
