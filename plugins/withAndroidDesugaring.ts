import { ConfigPlugin, withAppBuildGradle, createRunOncePlugin } from 'expo/config-plugins';

const DESUGARING_DEPENDENCY =
  'coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.1.2"';

const KOTLINX_DATETIME_DEPENDENCY =
  'implementation "org.jetbrains.kotlinx:kotlinx-datetime:0.7.1-0.6.x-compat"';

const ensureDesugaringCompileOptions = (contents: string): string => {
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

const ensureDesugaringDependency = (contents: string): string => {
  if (contents.includes(DESUGARING_DEPENDENCY)) {
    return contents;
  }
  return contents.replace(
    /dependencies\s*{/,
    `dependencies {\n    ${DESUGARING_DEPENDENCY}`,
  );
};

const ensureKotlinxDatetimeDependency = (contents: string): string => {
  if (contents.includes(KOTLINX_DATETIME_DEPENDENCY)) {
    return contents;
  }
  return contents.replace(
    /dependencies\s*{/,
    `dependencies {\n    ${KOTLINX_DATETIME_DEPENDENCY}`,
  );
};

const withAndroidDesugaring: ConfigPlugin = (config) =>
  withAppBuildGradle(config, (configProps: any) => {
    if (configProps.modResults.language !== 'groovy') {
      return configProps;
    }

    let contents: string = configProps.modResults.contents;
    contents = ensureDesugaringCompileOptions(contents);
    contents = ensureDesugaringDependency(contents);
    contents = ensureKotlinxDatetimeDependency(contents);
    configProps.modResults.contents = contents;
    return configProps;
  });

export default createRunOncePlugin(
  withAndroidDesugaring,
  'with-android-desugaring',
  '1.0.0',
);
