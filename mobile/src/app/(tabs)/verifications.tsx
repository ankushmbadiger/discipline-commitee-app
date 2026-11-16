
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
    useTheme,
    Divider,
    Button,
    Portal,
    Dialog,
    TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';

interface Verification {
    id: string;
    requestedUsn: string;
    requestedFullName: string;
    requestedDepartment: string | null;
    requestedSemester: number | null;
    createdAt: string;
    requester: {
        id: string;
        fullName: string;
        email: string;
        college: {
            id: string;
            name: string;
            code: string;
        } | null;
    };
}

export default function VerificationsScreen() {
    const theme = useTheme();
    const { profile } = useAuth();

    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedVerification, setSelectedVerification] =
        useState<Verification | null>(null);
    const [dialogMode, setDialogMode] = useState<'approve' | 'reject' | null>(null);
    const [department, setDepartment] = useState('');
    const [semester, setSemester] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const fetchVerifications = useCallback(async () => {
        try {
            setError(null);

            const response = await api.get('/verifications');

            setVerifications(response.data.verifications || []);
        } catch (err) {
            setError('Unable to load verification requests. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const openApproveDialog = (item: Verification) => {
        setSelectedVerification(item);
        setDepartment(item.requestedDepartment || '');
        setSemester(
            item.requestedSemester != null
                ? String(item.requestedSemester)
                : '',
        );
        setActionError(null);
        setDialogMode('approve');
    };

    const openRejectDialog = (item: Verification) => {
        setSelectedVerification(item);
        setRejectionReason('');
        setActionError(null);
        setDialogMode('reject');
    };

    const closeDialog = () => {
        if (submitting) return;

        setDialogMode(null);
        setSelectedVerification(null);
        setActionError(null);
    };

    const handleApprove = async () => {
        if (!selectedVerification) return;

        const trimmedDepartment = department.trim();
        const parsedSemester = semester.trim()
            ? Number(semester.trim())
            : undefined;

        if (!trimmedDepartment) {
            setActionError('Department is required.');
            return;
        }

        if (
            parsedSemester !== undefined &&
            (!Number.isInteger(parsedSemester) ||
                parsedSemester < 1 ||
                parsedSemester > 12)
        ) {
            setActionError('Semester must be a number between 1 and 12.');
            return;
        }

        try {
            setSubmitting(true);
            setActionError(null);

            await api.post(
                `/verifications/${selectedVerification.id}/approve`,
                {
                    department: trimmedDepartment,
                    ...(parsedSemester !== undefined && {
                        semester: parsedSemester,
                    }),
                },
            );

            setVerifications((current) =>
                current.filter((item) => item.id !== selectedVerification.id),
            );

            setDialogMode(null);
            setSelectedVerification(null);

            Alert.alert('Approved', 'Student verification approved successfully.');
        } catch (err: any) {
            setActionError(
                err?.response?.data?.message ||
                'Unable to approve this verification. Please try again.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedVerification) return;

        const reason = rejectionReason.trim();

        if (reason.length < 3) {
            setActionError('Please enter a reason with at least 3 characters.');
            return;
        }

        try {
            setSubmitting(true);
            setActionError(null);

            await api.post(
                `/verifications/${selectedVerification.id}/reject`,
                { reason },
            );

            setVerifications((current) =>
                current.filter((item) => item.id !== selectedVerification.id),
            );

            setDialogMode(null);
            setSelectedVerification(null);

            Alert.alert('Rejected', 'Student verification rejected successfully.');
        } catch (err: any) {
            setActionError(
                err?.response?.data?.message ||
                'Unable to reject this verification. Please try again.',
            );
        } finally {
            setSubmitting(false);
        }
    };
    useEffect(() => {
        fetchVerifications();
    }, [fetchVerifications]);

    const formatDate = (value: string) =>
        new Date(value).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    if (!profile?.permissions?.canReviewStudentVerifications) {
        return (
            <SafeAreaView
                style={[
                    styles.container,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <View style={styles.center}>
                    <Text variant="titleMedium">Access unavailable</Text>
                    <Text
                        variant="bodyMedium"
                        style={{
                            color: theme.colors.onSurfaceVariant,
                            textAlign: 'center',
                        }}
                    >
                        You do not have permission to review student verifications.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
            edges={['top']}
        >
            <View style={styles.header}>
                <Text variant="headlineSmall">Student Verifications</Text>
                <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                >
                    Review student identity requests from your college.
                </Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 12 }}>
                        Loading verification requests...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text variant="bodyLarge">{error}</Text>
                    <Button
                        mode="outlined"
                        onPress={fetchVerifications}
                        style={{ marginTop: 16 }}
                    >
                        Try again
                    </Button>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchVerifications();
                            }}
                        />
                    }
                >
                    <Text
                        variant="bodyMedium"
                        style={{
                            color: theme.colors.onSurfaceVariant,
                            marginBottom: 16,
                        }}
                    >
                        {verifications.length} pending request
                        {verifications.length !== 1 ? 's' : ''}
                    </Text>

                    {verifications.length === 0 ? (
                        <Card
                            mode="elevated"
                            style={[
                                styles.card,
                                { backgroundColor: theme.colors.surface },
                            ]}
                        >
                            <Card.Content style={styles.empty}>
                                <Text variant="titleMedium">No pending requests</Text>
                                <Text
                                    variant="bodyMedium"
                                    style={{
                                        color: theme.colors.onSurfaceVariant,
                                        textAlign: 'center',
                                    }}
                                >
                                    All student verification requests have been reviewed.
                                </Text>
                            </Card.Content>
                        </Card>
                    ) : (
                        verifications.map((item) => (
                            <Card
                                key={item.id}
                                mode="elevated"
                                style={[
                                    styles.card,
                                    { backgroundColor: theme.colors.surface },
                                ]}
                            >
                                <Card.Content style={styles.cardContent}>
                                    <View style={styles.row}>
                                        <Text
                                            variant="titleMedium"
                                            style={{ flex: 1 }}
                                        >
                                            {item.requestedFullName}
                                        </Text>
                                        <Chip compact>
                                            Pending
                                        </Chip>
                                    </View>

                                    <Text
                                        variant="bodyLarge"
                                        style={{
                                            color: theme.colors.primary,
                                            marginTop: 8,
                                            fontWeight: '600',
                                        }}
                                    >
                                        {item.requestedUsn}
                                    </Text>

                                    <Divider style={{ marginVertical: 12 }} />

                                    <Text variant="bodyMedium">
                                        Department: {item.requestedDepartment || 'Not provided'}
                                    </Text>

                                    <Text variant="bodyMedium">
                                        Semester: {item.requestedSemester ?? 'Not provided'}
                                    </Text>

                                    <Text variant="bodyMedium">
                                        Requested by: {item.requester.fullName}
                                    </Text>

                                    <Text
                                        variant="bodySmall"
                                        style={{ color: theme.colors.onSurfaceVariant }}
                                    >
                                        {item.requester.email}
                                    </Text>

                                    {item.requester.college && (
                                        <Text
                                            variant="bodySmall"
                                            style={{ color: theme.colors.onSurfaceVariant }}
                                        >
                                            {item.requester.college.name}
                                        </Text>
                                    )}

                                    <Text
                                        variant="bodySmall"
                                        style={{
                                            color: theme.colors.onSurfaceVariant,
                                            marginTop: 8,
                                        }}
                                    >
                                        Submitted {formatDate(item.createdAt)}
                                    </Text>
                                    <View style={styles.actions}>
                                        <Button
                                            mode="contained"
                                            onPress={() => openApproveDialog(item)}
                                            style={styles.actionButton}
                                        >
                                            Approve
                                        </Button>

                                        <Button
                                            mode="outlined"
                                            onPress={() => openRejectDialog(item)}
                                            style={styles.actionButton}
                                        >
                                            Reject
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )}
                </ScrollView>
            )}
            <Portal>
                <Dialog
                    visible={dialogMode === 'approve'}
                    onDismiss={closeDialog}
                >
                    <Dialog.Title>Approve Student Verification</Dialog.Title>

                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                            Approve {selectedVerification?.requestedFullName} (
                            {selectedVerification?.requestedUsn})?
                        </Text>

                        <TextInput
                            label="Department"
                            value={department}
                            onChangeText={setDepartment}
                            mode="outlined"
                            style={{ marginBottom: 12 }}
                        />

                        <TextInput
                            label="Semester (optional)"
                            value={semester}
                            onChangeText={setSemester}
                            keyboardType="number-pad"
                            mode="outlined"
                        />

                        {actionError && (
                            <Text
                                style={{
                                    color: theme.colors.error,
                                    marginTop: 8,
                                }}
                            >
                                {actionError}
                            </Text>
                        )}
                    </Dialog.Content>

                    <Dialog.Actions>
                        <Button onPress={closeDialog} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleApprove}
                            loading={submitting}
                            disabled={submitting}
                        >
                            Approve
                        </Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog
                    visible={dialogMode === 'reject'}
                    onDismiss={closeDialog}
                >
                    <Dialog.Title>Reject Student Verification</Dialog.Title>

                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                            Reject {selectedVerification?.requestedFullName} (
                            {selectedVerification?.requestedUsn})?
                        </Text>

                        <TextInput
                            label="Reason for rejection"
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                        />

                        {actionError && (
                            <Text
                                style={{
                                    color: theme.colors.error,
                                    marginTop: 8,
                                }}
                            >
                                {actionError}
                            </Text>
                        )}
                    </Dialog.Content>

                    <Dialog.Actions>
                        <Button onPress={closeDialog} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            buttonColor={theme.colors.error}
                            onPress={handleReject}
                            loading={submitting}
                            disabled={submitting}
                        >
                            Reject
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
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 8,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
    },
    card: {
        borderRadius: 18,
        marginBottom: 16,
        elevation: 1,
    },
    cardContent: {
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
});
