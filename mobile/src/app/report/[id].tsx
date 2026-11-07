
import { ScrollView, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Text,
  useTheme,
  Card,
  Chip,
  IconButton,
  Divider,
  Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const sampleReports = [
  {
    id: 'DC-001',
    teacher: 'Prof. Rajesh Kumar',
    initials: 'RK',
    department: 'Computer Science',
    time: '2 hours ago',
    category: 'Classroom Disruption',
    status: 'Under Review',
    description:
      'An incident involving disruption during an ongoing lecture was reported in Room 204.',
    location: 'Block A · Room 204',
  },
  {
    id: 'DC-002',
    teacher: 'Prof. Priya Sharma',
    initials: 'PS',
    department: 'Electronics',
    time: 'Yesterday',
    category: 'Property Damage',
    status: 'Pending Review',
    description:
      'Damage to laboratory equipment was reported during the afternoon practical session.',
    location: 'Electronics Lab',
  },
  {
    id: 'DC-003',
    teacher: 'Prof. Arun Rao',
    initials: 'AR',
    department: 'Mechanical',
    time: '2 days ago',
    category: 'Misconduct',
    status: 'Resolved',
    description:
      'A disciplinary incident was documented and subsequently reviewed by the committee.',
    location: 'Main Building',
  },
];

export default function ReportDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const report = sampleReports.find((item) => item.id === id);

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge">Report not found</Text>
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
        <Text variant="titleLarge">Report details</Text>
        <View style={{ width: 48 }} />
      </View>

      <Divider />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
            {report.id}
          </Text>

          <Chip compact>{report.status}</Chip>
        </View>

        <Text variant="headlineSmall" style={styles.title}>
          {report.category}
        </Text>

        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Submitted {report.time}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Reported by</Text>

            <View style={styles.teacherRow}>
              <Avatar.Text
                size={48}
                label={report.initials}
                style={{ backgroundColor: theme.colors.secondaryContainer }}
                color={theme.colors.onSecondaryContainer}
              />

              <View style={{ flex: 1 }}>
                <Text variant="titleSmall">{report.teacher}</Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {report.department}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Incident information</Text>

            <Text
              variant="bodyMedium"
              style={styles.description}
            >
              {report.description}
            </Text>

            <Divider style={{ marginVertical: 14 }} />

            <Text variant="labelMedium">Location</Text>
            <Text variant="bodyMedium">{report.location}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Evidence</Text>

            <View
              style={[
                styles.evidence,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Avatar.Icon
                icon="image-outline"
                size={48}
                style={{ backgroundColor: 'transparent' }}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                No evidence uploaded yet
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Text
          variant="bodySmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
            marginVertical: 20,
          }}
        >
          A submitted report is an allegation for review, not a finding of guilt.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    marginTop: 12,
    marginBottom: 6,
  },
  card: {
    marginTop: 16,
    borderRadius: 16,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  description: {
    marginTop: 14,
    lineHeight: 23,
  },
  evidence: {
    height: 160,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
