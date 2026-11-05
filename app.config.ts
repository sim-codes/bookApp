import "tsx/cjs";
import { ExpoConfig } from "expo/config";

module.exports = ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  name: "Spinematch",
  slug: "bookApp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "spinematch",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FF6B35",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    // Books and covers come through the system file and photo pickers, which need no permissions.
    permissions: [],
    blockedPermissions: [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_AUDIO",
      "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
    ],
    package: "com.simcodes.spinematch",
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
        backgroundColor: "#FFF8F0",
        dark: {
          backgroundColor: "#1A1A1A",
        },
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Spinematch lets you pick a photo to use as a book cover.",
        cameraPermission: false,
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
    "./plugins/withReadiumKotlinOptIn",
    "./plugins/withHiddenReadiumPositionLabel",
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
          extraProguardRules: [
            "-keep class org.readium.** { *; }",
            "-keep class com.reactnativereadium.** { *; }",
            "-keepclassmembers class * extends androidx.lifecycle.ViewModel { <init>(...); }",
          ].join("\n"),
        },
      },
    ],
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
