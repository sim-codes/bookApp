// plugins/withNetworkSecurityConfig.ts
import { ConfigPlugin, withAndroidManifest, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const withNetworkSecurityConfig: ConfigPlugin = (config) => {
    config = withDangerousMod(config, [
        'android',
        (configProps: any) => {
            const resDir = path.join(
                configProps.modRequest.platformProjectRoot,
                'app/src/main/res/xml'
            );

            if (!fs.existsSync(resDir)) {
                fs.mkdirSync(resDir, { recursive: true });
            }

            const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <debug-overrides>
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </debug-overrides>
  <base-config cleartextTrafficPermitted="${process.env.EAS_BUILD_PROFILE === 'development' ? 'true' : 'false'}">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">10.0.2.2</domain>
  </domain-config>
</network-security-config>`;

            fs.writeFileSync(
                path.join(resDir, 'network_security_config.xml'),
                networkSecurityConfig
            );

            return configProps;
        },
    ]);

    config = withAndroidManifest(config, (configProps: any) => {
        const mainApplication =
            configProps.modResults.manifest.application?.[0];
        if (mainApplication) {
            mainApplication.$['android:networkSecurityConfig'] =
                '@xml/network_security_config';
        }
        return configProps;
    });

    return config;
};

export default withNetworkSecurityConfig;
