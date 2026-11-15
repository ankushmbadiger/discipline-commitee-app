import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Divider,
    List,
    SegmentedButtons,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
} from 'firebase/auth';

import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/auth-context';
import { useAppTheme } from '../../constants/theme-context';
import type { PaletteName, ThemeMode } from '../../constants/theme';

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

    const [passwordFormVisible, setPasswordFormVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const clearPasswordFields = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Missing information', 'Please fill in all password fields.');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert(
                'Invalid password',
                'Your new password must contain at least 8 characters.'
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Password mismatch', 'The new passwords do not match.');
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert(
                'Invalid password',
                'Your new password must be different from your current password.'
            );
            return;
        }

        const firebaseUser = auth.currentUser;

        if (!firebaseUser || !firebaseUser.email) {
            Alert.alert(
                'Unable to change password',
                'Please sign in again and try again.'
            );
            return;
        }

        setChangingPassword(true);

        try {
            const credential = EmailAuthProvider.credential(
                firebaseUser.email,
                currentPassword
            );

            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, newPassword);

            clearPasswordFields();
            setPasswordFormVisible(false);

            Alert.alert('Password updated', 'Your password has been changed successfully.');
        } catch (error: unknown) {
            const code = (error as { code?: string })?.code;

            let message = 'Unable to change your password. Please try again.';

            switch (code) {
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    message = 'Your current password is incorrect.';
                    break;

                case 'auth/weak-password':
                    message = 'Your new password is too weak. Please choose a stronger password.';
                    break;

                case 'auth/requires-recent-login':
                    message = 'Please sign out and sign in again before changing your password.';
                    break;

                case 'auth/too-many-requests':
                    message = 'Too many attempts. Please wait a while and try again.';
                    break;
            }

            Alert.alert('Password change failed', message);
        } finally {
            setChangingPassword(false);
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

    const displayName =
        profile?.fullName ||
        user?.displayName ||
        (user ? 'Signed-in user' : 'Guest');

    const avatarLabel = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase() || 'G';

    return (
        <SafeAreaView
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
            edges={['top']}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="headlineMedium" style={styles.heading}>
                    Settings
                </Text>

                {/* Profile */}
                <Card
                    style={[
                        styles.profileCard,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <Card.Content style={styles.profileContent}>
                        <Avatar.Text
                            size={64}
                            label={avatarLabel}
                            style={{
                                backgroundColor: theme.colors.primaryContainer,
                            }}
                            color={theme.colors.onPrimaryContainer}
                        />

                        <View style={styles.profileInfo}>
                            <Text variant="titleMedium">
                                {displayName}
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

                            {user && profile?.role && (
                                <Text
                                    variant="bodySmall"
                                    style={{ color: theme.colors.primary }}
                                >
                                    {profile.role.replaceAll('_', ' ')}
                                </Text>
                            )}
                        </View>
                    </Card.Content>
                </Card>

                {/* Account */}
                {user && (
                    <>
                        <Text variant="titleSmall" style={styles.sectionTitle}>
                            ACCOUNT
                        </Text>

                        <Card
                            style={[
                                styles.sectionCard,
                                { backgroundColor: theme.colors.surface },
                            ]}
                        >
                            {profileLoading ? (
                                <Card.Content>
                                    <Text variant="bodyMedium">
                                        Loading account information...
                                    </Text>
                                </Card.Content>
                            ) : profileError ? (
                                <Card.Content>
                                    <Text
                                        variant="bodySmall"
                                        style={{ color: theme.colors.error }}
                                    >
                                        {profileError}
                                    </Text>
                                </Card.Content>
                            ) : (
                                <View>
                                    <List.Item
                                        title="Account status"
                                        description={profile?.accountStatus || 'Unknown'}
                                        left={props => (
                                            <List.Icon {...props} icon="account-check-outline" />
                                        )}
                                    />

                                    {profile?.college ? (
                                        <>
                                            <Divider />
                                            <List.Item
                                                title="College"
                                                description={profile.college.name}
                                                left={props => (
                                                    <List.Icon {...props} icon="school-outline" />
                                                )}
                                            />
                                        </>
                                    ) : null}
                                </View>
                            )}
                            <Divider />

                            <List.Item
                                title="Change password"
                                description="Update your account password"
                                left={props => (
                                    <List.Icon {...props} icon="lock-outline" />
                                )}
                                right={props => (
                                    <List.Icon
                                        {...props}
                                        icon={passwordFormVisible ? 'chevron-up' : 'chevron-down'}
                                    />
                                )}
                                onPress={() => {
                                    if (passwordFormVisible) {
                                        clearPasswordFields();
                                    }
                                    setPasswordFormVisible(!passwordFormVisible);
                                }}
                            />

                            {passwordFormVisible && (
                                <>
                                    <Divider />

                                    <Card.Content style={styles.passwordForm}>
                                        <Text variant="bodyMedium">
                                            Enter your current password and choose a new one.
                                        </Text>

                                        <TextInput
                                            label="Current password"
                                            value={currentPassword}
                                            onChangeText={setCurrentPassword}
                                            mode="outlined"
                                            secureTextEntry
                                            autoCapitalize="none"
                                            style={styles.passwordInput}
                                        />

                                        <TextInput
                                            label="New password"
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            mode="outlined"
                                            secureTextEntry
                                            autoCapitalize="none"
                                            style={styles.passwordInput}
                                        />

                                        <TextInput
                                            label="Confirm new password"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            mode="outlined"
                                            secureTextEntry
                                            autoCapitalize="none"
                                            style={styles.passwordInput}
                                        />

                                        <Text
                                            variant="bodySmall"
                                            style={{
                                                color: theme.colors.onSurfaceVariant,
                                                marginBottom: 16,
                                            }}
                                        >
                                            Your new password must contain at least 8 characters.
                                        </Text>

                                        <View style={styles.passwordActions}>
                                            <Button
                                                mode="outlined"
                                                onPress={() => {
                                                    clearPasswordFields();
                                                    setPasswordFormVisible(false);
                                                }}
                                                disabled={changingPassword}
                                                style={styles.passwordButton}
                                            >
                                                Cancel
                                            </Button>

                                            <Button
                                                mode="contained"
                                                onPress={handleChangePassword}
                                                loading={changingPassword}
                                                disabled={changingPassword}
                                                style={styles.passwordButton}
                                            >
                                                Update password
                                            </Button>
                                        </View>
                                    </Card.Content>
                                </>
                            )}
                        </Card>
                    </>
                )}

                {/* Appearance */}
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
                            onValueChange={value => setMode(value as ThemeMode)}
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
                            onValueChange={value => setPalette(value as PaletteName)}
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
                        left={props => (
                            <List.Icon {...props} icon="information-outline" />
                        )}
                    />

                    <Divider />

                    <List.Item
                        title="App version"
                        description="1.0.0 (Development)"
                        left={props => (
                            <List.Icon {...props} icon="cellphone" />
                        )}
                    />
                </Card>

                {/* Authentication */}
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
                    />
                )}

                <Text
                    variant="bodySmall"
                    style={[
                        styles.footer,
                        { color: theme.colors.onSurfaceVariant },
                    ]}
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
        elevation: 0,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#88888855',
        overflow: 'hidden',
    },
    passwordForm: {
        paddingTop: 16,
        paddingBottom: 20,
    },
    passwordInput: {
        marginTop: 14,
    },
    passwordActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        gap: 8,
    },
    passwordButton: {
        marginTop: 4,
    },
    footer: {
        textAlign: 'center',
        marginTop: 24,
    },
});
