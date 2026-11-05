import { ConfigPlugin, withProjectBuildGradle, createRunOncePlugin } from 'expo/config-plugins';

const OPT_IN = "kotlin.time.ExperimentalTime";

const OPT_IN_BLOCK = `
subprojects { subproject ->
    if (subproject.name == 'react-native-readium') {
        subproject.pluginManager.withPlugin('org.jetbrains.kotlin.android') {
            subproject.kotlin.compilerOptions.optIn.add('${OPT_IN}')
        }
    }
}
`;

const withReadiumKotlinOptIn: ConfigPlugin = (config) =>
  withProjectBuildGradle(config, (configProps: any) => {
    if (configProps.modResults.language !== 'groovy') {
      return configProps;
    }

    const contents: string = configProps.modResults.contents;
    if (!contents.includes(OPT_IN)) {
      configProps.modResults.contents = contents + OPT_IN_BLOCK;
    }
    return configProps;
  });

export default createRunOncePlugin(
  withReadiumKotlinOptIn,
  'with-readium-kotlin-opt-in',
  '1.0.0',
);
