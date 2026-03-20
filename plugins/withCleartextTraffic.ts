import { ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';

const withCleartextTraffic: ConfigPlugin = (config) =>
  withAndroidManifest(config, (configProps: any) => {
    const mainApplication =
      configProps.modResults.manifest.application?.[0];
    if (mainApplication) {
      mainApplication.$['android:usesCleartextTraffic'] = 'true';
    }
    return configProps;
  });

export default withCleartextTraffic;
