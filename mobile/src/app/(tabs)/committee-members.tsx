import { useCallback, useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Alert,
} from 'react-native';
import {
    Text,
    Card,
    Chip,
    ActivityIndicator,
    Button,
    useTheme,
    Divider,
    Dialog,
    Portal,
    TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/lib/api';

interface CommitteeMember {
    id: string;
    fullName: string;
    email: string;
    accountStatus: string;
    createdAt: string;
    hasVerificationPermission: boolean;
}

export default function CommitteeMembersScreen() {
    const theme = useTheme();

    const [members, setMembers] = useState<CommitteeMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const [createOpen, setCreateOpen] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [creating, setCreating] = useState(false);
    const fetchMembers = useCallback(async () => {
        try {
            setError('');

            const response = await api.get('/college-admin/committee-members');

            setMembers(response.data.committeeMembers);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                'Failed to load committee members.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMembers();
    };


    const handleCreateMember = async () => {
        if (!fullName.trim() || !email.trim() || !password) {
            Alert.alert('Missing fields', 'Please fill in all fields.');
            return;
        }

        if (password.length < 8) {
            Alert.alert(
                'Invalid password',
                'Password must contain at least 8 characters.'
            );
            return;
        }

        try {
            setCreating(true);

            const response = await api.post(
                '/college-admin/committee-members',
                {
                    fullName: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                }
            );

            setMembers((current) => [
                response.data.user,
                ...current,
            ]);

            setCreateOpen(false);
            setFullName('');
            setEmail('');
            setPassword('');

            Alert.alert(
                'Success',
                'Committee Member account created successfully.'
            );
        } catch (err: any) {
            Alert.alert(
                'Creation failed',
                err.response?.data?.message ||
                'Could not create the Committee Member account.'
            );
        } finally {
            setCreating(false);
        }
    };


    const handleTogglePermission = async (member: CommitteeMember) => {
        const currentlyGranted = member.hasVerificationPermission;

        try {
            const url = `/college-admin/committee-members/${member.id}/verification-permission`;

            if (currentlyGranted) {
                await api.delete(url);
            } else {
                await api.post(url);
            }

            setMembers((current) =>
                current.map((item) =>
                    item.id === member.id
                        ? {
                            ...item,
                            hasVerificationPermission: !currentlyGranted,
                        }
                        : item
                )
            );

            Alert.alert(
                'Success',
                currentlyGranted
                    ? 'Verification-review permission revoked.'
                    : 'Verification-review permission granted.'
            );
        } catch (err: any) {
            Alert.alert(
                'Operation failed',
                err.response?.data?.message ||
                'Could not update verification-review permission.'
            );
        }
    };

    return (
        <SafeAreaView
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
            edges={['top']}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
            >
                <Text variant="headlineSmall" style={styles.title}>
                    Committee Members
                </Text>

                <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                >
                    Manage your college's committee members and their
                    verification-review permissions.
                </Text>

                <Button
                    mode="contained"
                    icon="account-plus"
                    onPress={() => setCreateOpen(true)}
                    style={styles.createButton}
                >
                    Create Committee Member
                </Button>
                <Divider style={styles.divider} />

                {loading ? (
                    <ActivityIndicator style={styles.loader} />
                ) : error ? (
                    <Text style={{ color: theme.colors.error }}>
                        {error}
                    </Text>
                ) : members.length === 0 ? (
                    <Text>No committee members found.</Text>
                ) : (
                    members.map((member) => (
                        <Card key={member.id} style={styles.card}>
                            <Card.Content>
                                <Text variant="titleMedium">
                                    {member.fullName}
                                </Text>
                                <Text variant="bodyMedium">
                                    {member.email}
                                </Text>
                                <Chip
                                    style={styles.chip}
                                    compact
                                >
                                    {member.accountStatus}
                                </Chip>
                                <Chip
                                    style={styles.chip}
                                    icon={
                                        member.hasVerificationPermission
                                            ? 'shield-check'
                                            : 'shield-outline'
                                    }
                                    textStyle={{
                                        color: member.hasVerificationPermission
                                            ? theme.colors.primary
                                            : theme.colors.onSurfaceVariant,
                                    }}
                                >
                                    {member.hasVerificationPermission
                                        ? 'Can review verifications'
                                        : 'Cannot review verifications'}
                                </Chip>

                                <Button
                                    mode={member.hasVerificationPermission ? 'outlined' : 'contained'}
                                    onPress={() => handleTogglePermission(member)}
                                    style={styles.permissionButton}
                                >
                                    {member.hasVerificationPermission
                                        ? 'Revoke permission'
                                        : 'Grant permission'}
                                </Button>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </ScrollView>
            <Portal>
                <Dialog
                    visible={createOpen}
                    onDismiss={() => {
                        if (!creating) setCreateOpen(false);
                    }}
                >
                    <Dialog.Title>Create Committee Member</Dialog.Title>

                    <Dialog.Content>
                        <TextInput
                            label="Full name"
                            value={fullName}
                            onChangeText={setFullName}
                            mode="outlined"
                            style={styles.input}
                            disabled={creating}
                        />

                        <TextInput
                            label="Email address"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            disabled={creating}
                        />

                        <TextInput
                            label="Temporary password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry
                            style={styles.input}
                            disabled={creating}
                        />

                        <Text variant="bodySmall">
                            The password must contain at least 8 characters. The member
                            can change it later in Settings.
                        </Text>
                    </Dialog.Content>

                    <Dialog.Actions>
                        <Button
                            onPress={() => setCreateOpen(false)}
                            disabled={creating}
                        >
                            Cancel
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleCreateMember}
                            loading={creating}
                            disabled={creating}
                        >
                            Create
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 32,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    divider: {
        marginVertical: 16,
    },
    loader: {
        marginTop: 24,
    },
    card: {
        marginBottom: 12,
    },
    chip: {
        alignSelf: 'flex-start',
        marginTop: 10,
    },
    createButton: {
        marginTop: 16,
    },
    input: {
        marginBottom: 12,
    },
    permissionButton: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
});