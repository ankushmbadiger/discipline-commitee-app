
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Divider,
    IconButton,
    Searchbar,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../context/auth-context';
import api from '../lib/api';

interface College {
    id: string;
    name: string;
    code: string;
}

interface Student {
    id: string;
    usn: string;
    fullName: string;
    department: string;
    semester: number | null;
    college: College;
}

export default function ManageStudentsScreen() {
    const theme = useTheme();
    const { profile, profileLoading } = useAuth();

    const isPlatformAdmin = profile?.role === 'PLATFORM_ADMIN';

    const [colleges, setColleges] = useState<College[]>([]);
    const [selectedCollegeId, setSelectedCollegeId] = useState('');
    const [collegeModalVisible, setCollegeModalVisible] = useState(false);

    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const [usn, setUsn] = useState('');
    const [fullName, setFullName] = useState('');
    const [department, setDepartment] = useState('');
    const [semester, setSemester] = useState('');

    const selectedCollege = colleges.find(
        college => college.id === selectedCollegeId
    );

    const loadColleges = useCallback(async () => {
        try {
            const response = await api.get('/admin/colleges');
            setColleges(response.data.colleges || []);
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Could not load colleges.'
            );
        }
    }, []);

    const loadStudents = useCallback(async () => {
        if (isPlatformAdmin && !selectedCollegeId) {
            setStudents([]);
            return;
        }

        setLoading(true);

        try {
            const response = await api.get('/students', {
                params: {
                    ...(isPlatformAdmin
                        ? { collegeId: selectedCollegeId }
                        : {}),
                    ...(search.trim() ? { search: search.trim() } : {}),
                },
            });

            setStudents(response.data.students || []);
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Could not load students.'
            );
        } finally {
            setLoading(false);
        }
    }, [isPlatformAdmin, selectedCollegeId, search]);

    useEffect(() => {
        if (profileLoading) return;

        if (
            profile?.role !== 'PLATFORM_ADMIN' &&
            profile?.role !== 'COLLEGE_ADMIN'
        ) {
            Alert.alert('Access denied', 'You cannot manage student records.');
            router.back();
            return;
        }

        if (isPlatformAdmin) {
            loadColleges();
        }
    }, [profileLoading, profile?.role, isPlatformAdmin, loadColleges]);

    useEffect(() => {
        if (profileLoading) return;

        if (!isPlatformAdmin || selectedCollegeId) {
            loadStudents();
        }
    }, [profileLoading, isPlatformAdmin, selectedCollegeId, loadStudents]);

    const resetForm = () => {
        setUsn('');
        setFullName('');
        setDepartment('');
        setSemester('');
        setEditingStudent(null);
    };

    const startEditing = (student: Student) => {
        setEditingStudent(student);
        setUsn(student.usn);
        setFullName(student.fullName);
        setDepartment(student.department);
        setSemester(
            student.semester !== null ? String(student.semester) : ''
        );
    };

    const saveStudent = async () => {
        if (!usn.trim() || !fullName.trim() || !department.trim()) {
            Alert.alert(
                'Missing information',
                'USN, full name and department are required.'
            );
            return;
        }

        let semesterValue: number | null = null;

        if (semester.trim()) {
            semesterValue = Number(semester);

            if (
                !Number.isInteger(semesterValue) ||
                semesterValue < 1
            ) {
                Alert.alert(
                    'Invalid semester',
                    'Enter a valid positive semester number.'
                );
                return;
            }
        }

        if (isPlatformAdmin && !selectedCollegeId) {
            Alert.alert('Select college', 'Please select a college first.');
            return;
        }

        const payload = {
            usn: usn.trim().toUpperCase(),
            fullName: fullName.trim(),
            department: department.trim(),
            semester: semesterValue,
            ...(isPlatformAdmin ? { collegeId: selectedCollegeId } : {}),
        };

        setSaving(true);

        try {
            if (editingStudent) {
                await api.patch(`/students/${editingStudent.id}`, payload);
                Alert.alert('Success', 'Student details updated.');
            } else {
                await api.post('/students', payload);
                Alert.alert('Success', 'Student added successfully.');
            }

            resetForm();
            await loadStudents();
        } catch (error: any) {
            Alert.alert(
                editingStudent ? 'Update failed' : 'Creation failed',
                error.response?.data?.message ||
                    'Could not save student details.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (profileLoading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator />
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
                <IconButton
                    icon="arrow-left"
                    onPress={() => router.back()}
                />
                <Text variant="headlineSmall" style={styles.heading}>
                    Manage Students
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {isPlatformAdmin && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium">Select college</Text>

                            <Button
                                mode="outlined"
                                icon="school-outline"
                                onPress={() => setCollegeModalVisible(true)}
                                style={styles.collegeButton}
                                contentStyle={styles.buttonContent}
                            >
                                {selectedCollege
                                    ? `${selectedCollege.name} (${selectedCollege.code})`
                                    : 'Choose a college'}
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {(!isPlatformAdmin || selectedCollegeId) && (
                    <>
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text variant="titleLarge">
                                    {editingStudent
                                        ? 'Edit student'
                                        : 'Add student'}
                                </Text>

                                <TextInput
                                    label="USN"
                                    value={usn}
                                    onChangeText={setUsn}
                                    mode="outlined"
                                    autoCapitalize="characters"
                                    style={styles.input}
                                />

                                <TextInput
                                    label="Full name"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    mode="outlined"
                                    autoCapitalize="words"
                                    style={styles.input}
                                />

                                <TextInput
                                    label="Department"
                                    value={department}
                                    onChangeText={setDepartment}
                                    mode="outlined"
                                    autoCapitalize="words"
                                    style={styles.input}
                                />

                                <TextInput
                                    label="Semester (optional)"
                                    value={semester}
                                    onChangeText={setSemester}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={styles.input}
                                />

                                <Button
                                    mode="contained"
                                    onPress={saveStudent}
                                    loading={saving}
                                    disabled={saving}
                                    style={styles.actionButton}
                                >
                                    {editingStudent
                                        ? 'Update student'
                                        : 'Add student'}
                                </Button>

                                {editingStudent && (
                                    <Button
                                        mode="text"
                                        onPress={resetForm}
                                    >
                                        Cancel editing
                                    </Button>
                                )}
                            </Card.Content>
                        </Card>

                        <Text variant="titleLarge" style={styles.listHeading}>
                            Student records
                        </Text>

                        <Searchbar
                            placeholder="Search USN, name or department"
                            value={search}
                            onChangeText={setSearch}
                            style={styles.search}
                        />

                        {loading ? (
                            <ActivityIndicator
                                style={styles.loader}
                                size="large"
                            />
                        ) : students.length === 0 ? (
                            <Text
                                style={[
                                    styles.emptyText,
                                    { color: theme.colors.onSurfaceVariant },
                                ]}
                            >
                                No student records found.
                            </Text>
                        ) : (
                            students.map(student => (
                                <Card key={student.id} style={styles.studentCard}>
                                    <Card.Content>
                                        <View style={styles.studentHeader}>
                                            <View style={styles.studentInfo}>
                                                <Text variant="titleMedium">
                                                    {student.fullName}
                                                </Text>
                                                <Text
                                                    variant="bodyMedium"
                                                    style={{
                                                        color: theme.colors.primary,
                                                    }}
                                                >
                                                    {student.usn}
                                                </Text>
                                            </View>

                                            <IconButton
                                                icon="pencil-outline"
                                                onPress={() => startEditing(student)}
                                            />
                                        </View>

                                        <Divider style={styles.divider} />

                                        <Text variant="bodyMedium">
                                            Department: {student.department}
                                        </Text>
                                        <Text variant="bodyMedium">
                                            Semester: {student.semester ?? 'Not specified'}
                                        </Text>
                                        {isPlatformAdmin && (
                                            <Text variant="bodySmall">
                                                College: {student.college?.name}
                                            </Text>
                                        )}
                                    </Card.Content>
                                </Card>
                            ))
                        )}
                    </>
                )}
            </ScrollView>

            <Modal
                visible={collegeModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCollegeModalVisible(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setCollegeModalVisible(false)}
                >
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: theme.colors.surface },
                        ]}
                    >
                        <Text variant="titleLarge" style={styles.modalHeading}>
                            Choose college
                        </Text>

                        <FlatList
                            data={colleges}
                            keyExtractor={item => item.id}
                            ListEmptyComponent={
                                <Text>No colleges available.</Text>
                            }
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.collegeItem}
                                    onPress={() => {
                                        setSelectedCollegeId(item.id);
                                        setCollegeModalVisible(false);
                                        resetForm();
                                    }}
                                >
                                    <View>
                                        <Text variant="titleMedium">
                                            {item.name}
                                        </Text>
                                        <Text variant="bodySmall">
                                            {item.code}
                                        </Text>
                                    </View>
                                    {selectedCollegeId === item.id && (
                                        <IconButton
                                            icon="check"
                                            size={20}
                                        />
                                    )}
                                </Pressable>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    heading: {
        fontWeight: '600',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 20,
        borderRadius: 16,
    },
    input: {
        marginTop: 12,
    },
    collegeButton: {
        marginTop: 12,
    },
    buttonContent: {
        minHeight: 48,
    },
    actionButton: {
        marginTop: 18,
    },
    listHeading: {
        marginBottom: 12,
        marginTop: 8,
    },
    search: {
        marginBottom: 16,
    },
    loader: {
        marginTop: 24,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 24,
    },
    studentCard: {
        marginBottom: 12,
        borderRadius: 14,
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    studentInfo: {
        flex: 1,
    },
    divider: {
        marginVertical: 10,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        maxHeight: '70%',
        borderRadius: 20,
        padding: 20,
    },
    modalHeading: {
        marginBottom: 12,
    },
    collegeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#88888855',
    },
});
