
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/auth-context';

export default function TabLayout() {
  const theme = useTheme();
  const { profile, loading, profileLoading } = useAuth();

  const role = profile?.role;
  const canCreateReport = !loading && !profileLoading &&
    role === 'COMMITTEE_MEMBER';

  const canViewCases =
    !loading &&
    !profileLoading &&
    role === 'STUDENT' &&
    Boolean(profile?.student);
  const iconColor = (color: any): string =>
    typeof color === 'string' ? color : '#000000';
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
            <View style={{
              width: 64,
              height: 32,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused
                ? theme.colors.secondaryContainer
                : 'transparent',
            }}>
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={iconColor(color)}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          href: canCreateReport ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              width: 64,
              height: 32,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused
                ? theme.colors.secondaryContainer
                : 'transparent',
            }}>
              <MaterialCommunityIcons
                name={focused ? 'plus-box' : 'plus-box-outline'}
                size={size}
                color={iconColor(color)}
              />
            </View>
          ),
        }}
      />


      <Tabs.Screen
        name="my-cases"
        options={{
          title: 'My Cases',
          href: canViewCases ? undefined : null,
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
                name={focused ? 'file-document-multiple' : 'file-document-multiple-outline'}
                size={size}
                color={iconColor(color)}
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
            <View style={{
              width: 64,
              height: 32,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused
                ? theme.colors.secondaryContainer
                : 'transparent',
            }}>
              <MaterialCommunityIcons
                name={focused ? 'cog' : 'cog-outline'}
                size={size}
                color={iconColor(color)}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
