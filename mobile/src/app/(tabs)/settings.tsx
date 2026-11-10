
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import {
    Avatar,
    Card,
    Divider,
    List,
    Switch,
    Text,
    useTheme,
    TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAppTheme } from '../../constants/theme-context';
import type { PaletteName, ThemeMode } from '../../constants/theme';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import {
    SegmentedButtons,
} from 'react-native-paper';
import { Button } from 'react-native-paper';
import api from '../../lib/api';

export default function SettingsScreen() {
    const theme = useTheme();
    const {
        user,
        profile,
        profileLoading,
        profileError,
        signOut,
    } = useAuth();
    const {
        palette,
        setPalette,
        mode,
        setMode,
    } = useAppTheme();
    const [notifications, setNotifications] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(false);

    const [memberName, setMemberName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [memberPassword, setMemberPassword] = useState('');
    const [collegeCode, setCollegeCode] = useState('E091');
    const [creatingMember, setCreatingMember] = useState(false);
    const testAdminAccess = async () => {
        try {
            const response = await api.get('/admin/student-verifications');

            Alert.alert(
                'Admin API Success',
                `Pending requests: ${response.data.count}`
            );
        } catch (error: any) {
            console.error('Admin API test failed:', error.response?.data || error);

            Alert.alert(
                'Admin API Failed',
                error.response?.data?.message ||
                'Could not connect to the admin API.'
            );
        }
    };

    const testMyProfile = async () => {
        try {
            const response = await api.get('/auth/me');

            console.log('My profile:', response.data);

            Alert.alert(
                'Profile API Success',
                `Name: ${response.data.data.fullName}\nRole: ${response.data.data.role}\nCollege: ${response.data.data.college?.name ?? 'Platform Admin'}`
            );
        } catch (error: any) {
            console.error(
                'Profile API failed:',
                error.response?.data || error
            );

            Alert.alert(
                'Profile API Failed',
                error.response?.data?.message || 'Could not retrieve profile.'
            );
        }
    };

    const createCommitteeMember = async () => {
        if (!memberName.trim() || !memberEmail.trim() || !memberPassword || !collegeCode.trim()) {
            Alert.alert('Missing information', 'Please fill in all fields.');
            return;
        }

        if (memberPassword.length < 8) {
            Alert.alert('Invalid password', 'Password must contain at least 8 characters.');
            return;
        }

        setCreatingMember(true);

        try {
            const response = await api.post('/admin/committee-members', {
                fullName: memberName.trim(),
                email: memberEmail.trim().toLowerCase(),
                password: memberPassword,
                collegeCode: collegeCode.trim().toUpperCase(),
            });

            Alert.alert(
                'Account created',
                `${response.data.user.fullName} can now sign in as a Committee Member.`
            );

            setMemberName('');
            setMemberEmail('');
            setMemberPassword('');
            setCollegeCode('E091');
        } catch (error: any) {
            console.error('Committee Member creation failed:', error.response?.data || error);

            Alert.alert(
                'Account creation failed',
                error.response?.data?.message || 'Could not create the account.'
            );
        } finally {
            setCreatingMember(false);
        }
    };
    const testApproveVerification = async () => {
        try {
            const response = await api.post(
                '/admin/student-verifications/77df7376-17bd-4863-87d9-04b924fc3b91/approve',
                {}
            );

            Alert.alert('Approval Success', response.data.message);
        } catch (error: any) {
            console.error(
                'Approval test failed:',
                error.response?.data || error
            );

            Alert.alert(
                'Approval Failed',
                error.response?.data?.message || 'Could not approve verification.'
            );
        }
    };
    const handleLogout = () => {
        Alert.alert(
            'Log out',
            'Are you sure you want to log out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Log out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace('/');
                        } catch (error) {
                            Alert.alert(
                                'Logout failed',
                                'Unable to log out. Please try again.'
                            );
                            console.error('Logout error:', error);
                        }
                    },
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
                            label={
                                user?.email
                                    ? user.email.substring(0, 2).toUpperCase()
                                    : 'G'
                            }
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            color={theme.colors.onPrimaryContainer}
                        />

                        <View style={styles.profileInfo}>
                            <Text variant="titleMedium">
                                {user?.displayName || (user ? 'Signed-in user' : 'Guest')}
                            </Text>

                            <Text
                                variant="bodyMedium"
                                style={{ color: theme.colors.onSurfaceVariant }}
                            >
                                {user?.email || 'Not signed in'}
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.onSurfaceVariant }}
                            >
                                {user ? 'Authenticated account' : 'Public access'}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={{ marginHorizontal: 16, marginTop: 12 }}>
                    <Card.Content>
                        <Text variant="titleMedium">
                            Application Profile Test
                        </Text>

                        {profileLoading ? (
                            <Text>Loading profile...</Text>
                        ) : profileError ? (
                            <Text>{profileError}</Text>
                        ) : (
                            <>
                                <Text>Name: {profile?.fullName}</Text>
                                <Text>Role: {profile?.role}</Text>
                                <Text>College: {profile?.college?.name ?? "None"}</Text>
                                <Text>Account: {profile?.accountStatus}</Text>
                            </>
                        )}
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


                {profile?.role === 'PLATFORM_ADMIN' && (
                    <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Content>
                            <Text variant="titleMedium">
                                Create Committee Member
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}
                            >
                                Create a staff account for a college.
                            </Text>

                            <TextInput
                                label="Full name"
                                value={memberName}
                                onChangeText={setMemberName}
                                mode="outlined"
                                autoCapitalize="words"
                                style={{ marginBottom: 12 }}
                            />

                            <TextInput
                                label="Email address"
                                value={memberEmail}
                                onChangeText={setMemberEmail}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={{ marginBottom: 12 }}
                            />

                            <TextInput
                                label="Temporary password"
                                value={memberPassword}
                                onChangeText={setMemberPassword}
                                mode="outlined"
                                secureTextEntry
                                style={{ marginBottom: 12 }}
                            />

                            <TextInput
                                label="College code"
                                value={collegeCode}
                                onChangeText={setCollegeCode}
                                mode="outlined"
                                autoCapitalize="characters"
                                style={{ marginBottom: 16 }}
                            />

                            <Button
                                mode="contained"
                                onPress={createCommitteeMember}
                                loading={creatingMember}
                                disabled={creatingMember}
                            >
                                Create account
                            </Button>
                        </Card.Content>
                    </Card>
                )}
                {user && (
                    <Card
                        style={[
                            styles.sectionCard,
                            { backgroundColor: theme.colors.surface },
                        ]}
                    >
                        <Card.Content>
                            <Text variant="titleMedium">
                                Administrator testing
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.onSurfaceVariant }}
                            >
                                Test access to the protected verification API.
                            </Text>

                            <Button
                                mode="contained"
                                onPress={testAdminAccess}
                                style={{ marginTop: 12 }}
                            >
                                Test admin access
                            </Button>
                            <Button
                                mode="contained"
                                onPress={testApproveVerification}
                                style={{ marginTop: 12 }}
                            >
                                Test student approval
                            </Button>

                            <Button
                                mode="contained"
                                onPress={testMyProfile}
                                style={{ marginTop: 12 }}
                            >
                                Test my profile
                            </Button>
                        </Card.Content>
                    </Card>
                )}

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
                {user ? (
                    <List.Item
                        title="Log out"
                        description="Sign out of your account"
                        titleStyle={{ color: theme.colors.error }}
                        left={props => (
                            <List.Icon
                                {...props}
                                icon="logout"
                                color={theme.colors.error}
                            />
                        )}
                        onPress={handleLogout}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                ) : (
                    <List.Item
                        title="Sign in"
                        description="Log in to access your account"
                        left={props => (
                            <List.Icon
                                {...props}
                                icon="login"
                                color={theme.colors.primary}
                            />
                        )}
                        onPress={() => router.push('/login' as never)}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                )}

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
