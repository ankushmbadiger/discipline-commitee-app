
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: theme.colors.onSecondaryContainer,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,

        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          height: 56,
          paddingTop: 6,
          paddingBottom: 8,
          elevation: 0,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },

        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                width: 64,
                height: 32,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused
                  ? theme.colors.secondaryContainer
                  : 'transparent',
              }}
            >
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={typeof color === "number" ? "#000000" : color ?? "#000000"}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                width: 64,
                height: 32,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused
                  ? theme.colors.secondaryContainer
                  : 'transparent',
              }}
            >
              <MaterialCommunityIcons
                name={focused ? 'plus-box' : 'plus-box-outline'}
                size={size}
                color={typeof color === "number" ? "#000000" : color ?? "#000000"}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                width: 64,
                height: 32,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused
                  ? theme.colors.secondaryContainer
                  : 'transparent',
              }}
            >
              <MaterialCommunityIcons
                name={focused ? 'cog' : 'cog-outline'}
                size={size}
                color={typeof color === "number" ? "#000000" : color ?? "#000000"}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
