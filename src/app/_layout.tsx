import ToastProvider from '@/core/components/ui/toast';
import { DIProvider } from '@/core/di/di-provider';
import { useTheme } from '@/core/hooks/use-theme';
import { AuthProvider } from '@/features/auth/presentation/context/auth-context';
import { ViewerProvider } from '@/features/viewer/presentation/context/viewer-context';
import { ReconstructionProvider } from '@/features/reconstruction/presentation/context/reconstruction-context';
import { ScanProvider } from '@/features/scan/presentation/context/scan-context';
import "@/global.css";
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  const theme = useTheme();

  SplashScreen.preventAutoHideAsync();

  const [loaded, error] = useFonts({
    'Cal Sans': require('../../assets/fonts/Cal_Sans/CalSans-Regular.ttf'),
    'ABeeZee': require('../../assets/fonts/ABeeZee/ABeeZee-Regular.ttf'),
    'ABeeZee-Italic': require('../../assets/fonts/ABeeZee/ABeeZee-Italic.ttf'),
  });

  React.useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }
  return (
    <>
    <StatusBar 
          animated={true}
          barStyle="dark-content"
          showHideTransition="slide"
          hidden={true}
        />
    <DIProvider>
      <AuthProvider>
        <ViewerProvider>
          <ReconstructionProvider>
            <ScanProvider>
              <ThemeProvider value={theme}>
                <ToastProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(app)" options={{ headerShown: false }} />
                  </Stack>
                </ToastProvider>
                <PortalHost />
              </ThemeProvider>
            </ScanProvider>
          </ReconstructionProvider>
        </ViewerProvider>
      </AuthProvider>
    </DIProvider>
    </>
  );
}
