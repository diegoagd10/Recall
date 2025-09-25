export default {
  expo: {
    name: 'ActiveRecallApp',
    slug: 'ActiveRecallApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      BACKEND_API_CLIENT_ID: process.env.BACKEND_API_CLIENT_ID,
      BACKEND_API_CLIENT_SECRET: process.env.BACKEND_API_CLIENT_SECRET
    }
  }
};