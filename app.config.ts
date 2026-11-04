import "tsx/cjs";
import { ExpoConfig } from "expo/config";

module.exports = ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  name: "bookApp",
  slug: "bookApp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "bookapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    // Books come from the system document picker (no storage permission needed)
    // and the app never records audio, so only keep what's actually used.
    permissions: ["android.permission.ACCESS_NETWORK_STATE"],
    // react-native-blob-util's config plugin adds these; the app only reads
    // files from its own directories, so they're not needed.
    blockedPermissions: [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.DOWNLOAD_WITHOUT_NOTIFICATION",
    ],
    package: "com.sim_codes.bookApp",
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-font",
      {
        fonts: [
          "./assets/fonts/Poppins-SemiBold.ttf",
          "./assets/fonts/Poppins-Regular.ttf",
          "./assets/fonts/Modak-Regular.ttf",
        ],
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "bookApp accesses your photos so you can pick a cover image for your books.",
        microphonePermission: false,
        colors: {
          cropToolbarColor: "#000000",
        },
        dark: {
          colors: {
            cropToolbarColor: "#000000",
          },
        },
      },
    ],
    "./plugins/withAndroidDesugaring",
    "./plugins/withNetworkSecurityConfig",
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
        },
      },
    ],
    "@config-plugins/react-native-blob-util",
    "@config-plugins/react-native-pdf",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "0aca74ab-e0c5-4b1d-b8c0-8fc5ee15b358",
    },
  },
});
