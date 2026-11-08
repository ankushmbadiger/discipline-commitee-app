
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import {
    Avatar,
    Card,
    Divider,
    List,
    Switch,
    Text,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAppTheme } from '../../constants/theme-context';
import type { PaletteName, ThemeMode } from '../../constants/theme';

import {
    SegmentedButtons,
} from 'react-native-paper';


export default function SettingsScreen() {
    const theme = useTheme();

    const {
        palette,
        setPalette,
        mode,
        setMode,
    } = useAppTheme();
    const [notifications, setNotifications] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Log out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log out',
                    style: 'destructive',
                    onPress: () => Alert.alert('Demo', 'Logout will be implemented with authentication.'),
                },
            ]
        );
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            edges={['top']}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="headlineMedium" style={styles.heading}>
                    Settings
                </Text>

                {/* Profile */}
                <Card style={[
                    styles.profileCard,
                    { backgroundColor: theme.colors.surface },
                ]}
                >
                    <Card.Content style={styles.profileContent}>
                        <Avatar.Text
                            size={64}
                            label="AM"
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            color={theme.colors.onPrimaryContainer}
                        />

                        <View style={styles.profileInfo}>
                            <Text variant="titleMedium">Ankush M Badiger</Text>
                            <Text
                                variant="bodyMedium"
                                style={{ color: theme.colors.onSurfaceVariant }}
                            >
                                Committee Member
                            </Text>
                            <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.onSurfaceVariant }}
                            >
                                1KS25CS007
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Account */}
                <Text variant="titleSmall" style={styles.sectionTitle}>
                    ACCOUNT
                </Text>

                <Card
                    style={[
                        styles.sectionCard,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <List.Item
                        title="Personal information"
                        description="Manage your profile details"
                        left={props => <List.Icon {...props} icon="account-outline" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        style={{ backgroundColor: theme.colors.surface }}
                        onPress={() => Alert.alert('Coming soon', 'Profile editing will be implemented later.')}
                    />
                    <Divider />
                    <List.Item
                        title="Change password"
                        description="Update your account password"
                        left={props => <List.Icon {...props} icon="lock-outline" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => Alert.alert('Coming soon', 'Password management will be implemented later.')}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                </Card>

                {/* Notifications */}
                <Text variant="titleSmall" style={styles.sectionTitle}>
                    NOTIFICATIONS
                </Text>

                <Card
                    style={[
                        styles.sectionCard,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <List.Item
                        title="Push notifications"
                        description="Receive updates about reports"
                        left={props => <List.Icon {...props} icon="bell-outline" />}
                        style={{ backgroundColor: theme.colors.surface }}
                        right={() => (
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                            />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Email updates"
                        description="Receive updates through email"
                        left={props => <List.Icon {...props} icon="email-outline" />}
                        style={{ backgroundColor: theme.colors.surface }}
                        right={() => (
                            <Switch
                                value={emailUpdates}
                                onValueChange={setEmailUpdates}
                            />
                        )}
                    />
                </Card>

                {/* Privacy */}
                <Text variant="titleSmall" style={styles.sectionTitle}>
                    PRIVACY & SECURITY
                </Text>

                <Card
                    style={[
                        styles.sectionCard,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <List.Item
                        title="Privacy policy"
                        description="How your information is handled"
                        left={props => <List.Icon {...props} icon="shield-lock-outline" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => Alert.alert('Coming soon', 'Privacy policy will be added before deployment.')}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                    <Divider />
                    <List.Item
                        title="Help and support"
                        description="Get assistance with the app"
                        left={props => <List.Icon {...props} icon="help-circle-outline" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => Alert.alert('Help', 'Support information will be added later.')}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                </Card>



                <Text variant="titleSmall" style={styles.sectionTitle}>
                    APPEARANCE
                </Text>

                <Card
                    style={[
                        styles.sectionCard,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <Card.Content>
                        <Text variant="titleMedium">Color scheme</Text>
                        <Text
                            variant="bodySmall"
                            style={{ color: theme.colors.onSurfaceVariant }}
                        >
                            Choose your preferred app appearance
                        </Text>

                        <SegmentedButtons
                            value={mode}
                            onValueChange={(value) => setMode(value as ThemeMode)}
                            buttons={[
                                { value: 'system', label: 'System' },
                                { value: 'light', label: 'Light' },
                                { value: 'dark', label: 'Dark' },
                            ]}
                            style={{ marginTop: 16 }}
                        />

                        <Divider style={{ marginVertical: 20 }} />

                        <Text variant="titleMedium">Accent color</Text>

                        <SegmentedButtons
                            value={palette}
                            onValueChange={(value) => setPalette(value as PaletteName)}
                            buttons={[
                                { value: 'blue', label: 'Blue' },
                                { value: 'green', label: 'Green' },
                                { value: 'purple', label: 'Purple' },
                                { value: 'teal', label: 'Teal' },
                            ]}
                            style={{ marginTop: 16 }}
                        />
                    </Card.Content>
                </Card>



                {/* About */}
                <Text variant="titleSmall" style={styles.sectionTitle}>
                    ABOUT
                </Text>

                <Card
                    style={[
                        styles.sectionCard,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <List.Item
                        title="About this application"
                        description="College Discipline Committee"
                        left={props => <List.Icon {...props} icon="information-outline" />}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                    <Divider />
                    <List.Item
                        title="App version"
                        description="1.0.0 (Development)"
                        left={props => <List.Icon {...props} icon="cellphone" />}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                </Card>

                {/* Logout */}
                <List.Item
                    title="Log out"
                    titleStyle={{ color: theme.colors.error }}
                    left={props => (
                        <List.Icon {...props} icon="logout" color={theme.colors.error} />
                    )}
                    onPress={handleLogout}
                    style={styles.logout}
                    style={{ backgroundColor: theme.colors.surface }}
                />

                <Text
                    variant="bodySmall"
                    style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}
                >
                    College Discipline Committee App
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 32,
    },
    heading: {
        fontWeight: '600',
        marginBottom: 22,
    },
    profileCard: {
        borderRadius: 20,
        marginBottom: 28,
        elevation: 0,
        // borderWidth: StyleSheet.hairlineWidth,
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
        gap: 4,
    },
    sectionTitle: {
        marginBottom: 10,
        marginLeft: 4,
        letterSpacing: 1,
        color: '#888888',
    },
    sectionCard: {
        borderRadius: 18,
        marginBottom: 26,
        backgroundColor: 'transparent',
        elevation: 0,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#88888855',
        overflow: 'hidden',
    },
    logout: {
        marginTop: 4,
        borderRadius: 12,
    },
    footer: {
        textAlign: 'center',
        marginTop: 24,
    },
});
