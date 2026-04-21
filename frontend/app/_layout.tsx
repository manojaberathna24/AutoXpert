// Import polyfills FIRST before anything else
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
    useEffect(() => {
        // Any app initialization logic
    }, []);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
}
