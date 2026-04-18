import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  // ─── App identity ─────────────────────────────────────────
  appId: "py.com.cpb.app",
  appName: "CPB",

  // ─── Load the production web app (server URL mode) ────────
  // No static export needed — the native WebView loads cpb.com.py directly.
  webDir: "out",
  server: {
    url: "https://cpb.com.py",
    cleartext: false, // HTTPS only
    androidScheme: "https",
  },

  // ─── iOS ──────────────────────────────────────────────────
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a1628",
    allowsLinkPreview: false,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },

  // ─── Android ──────────────────────────────────────────────
  android: {
    backgroundColor: "#0a1628",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true only for dev builds
  },

  // ─── Plugins ──────────────────────────────────────────────
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#0a1628",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
    },
    StatusBar: {
      style: "DARK",            // white icons on dark background
      backgroundColor: "#0a1628",
      overlaysWebView: false,
    },
    App: {
      // handle back button on Android — prevents accidental exit
    },
  },
}

export default config
