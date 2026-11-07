
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import {
  Text,
  useTheme,
  Card,
  Avatar,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
const reports = [
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

export default function HomeScreen() {
  const router = useRouter();

  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return theme.colors.primary;
      case 'Under Review':
        return theme.colors.tertiary;
      default:
        return theme.colors.secondary;
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onBackground, fontWeight: '700' }}
          >
            Discipline
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Committee reports
          </Text>
        </View>

        <IconButton
          icon="bell-outline"
          size={25}
          onPress={() => { }}
          mode="outlined"
          accessibilityLabel="Notifications"
        />
      </View>

      <Divider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feed}
      >
        {/* Feed heading */}
        <View style={styles.sectionHeader}>
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onBackground, fontWeight: '600' }}
          >
            Recent reports
          </Text>

          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary }}
          >
            {reports.length} reports
          </Text>
        </View>

        {/* Report cards */}
        {reports.map((report) => (
          <Card
            key={report.id}
            mode="elevated"
            style={[
              styles.reportCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              {/* Teacher information */}
              <View style={styles.teacherRow}>
                <Avatar.Text
                  size={44}
                  label={report.initials}
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                  color={theme.colors.onSecondaryContainer}
                />

                <View style={styles.teacherInfo}>
                  <Text
                    variant="titleSmall"
                    style={{
                      color: theme.colors.onSurface,
                      fontWeight: '600',
                    }}
                  >
                    {report.teacher}
                  </Text>

                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {report.department} · {report.time}
                  </Text>
                </View>

                <IconButton
                  icon="dots-vertical"
                  size={21}
                  onPress={() => { }}
                />
              </View>

              {/* Category and status */}
              <View style={styles.chipRow}>
                <Chip
                  compact
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                  textStyle={{
                    color: theme.colors.onSecondaryContainer,
                    fontSize: 11,
                  }}
                >
                  {report.category}
                </Chip>

                <Chip
                  compact
                  style={{
                    backgroundColor: theme.colors.surfaceVariant,

                  }}
                  textStyle={{
                    color: getStatusColor(report.status),
                    fontSize: 11,
                  }}
                >
                  {report.status}
                </Chip>
              </View>

              {/* Incident description */}
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurface,
                  marginTop: 12,
                  lineHeight: 22,
                }}
              >
                {report.description}
              </Text>

              {/* Evidence placeholder */}
              <View
                style={[
                  styles.evidence,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Avatar.Icon
                  size={48}
                  icon="image-outline"
                  style={{ backgroundColor: 'transparent' }}
                  color={theme.colors.onSurfaceVariant}
                />

                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Evidence images will appear here
                </Text>
              </View>

              {/* Location and report ID */}
              <View style={styles.detailsRow}>
                <View style={styles.location}>
                  <IconButton
                    icon="map-marker-outline"
                    size={16}
                    iconColor={theme.colors.onSurfaceVariant}
                    style={{ margin: 0 }}
                  />
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {report.location}
                  </Text>
                </View>

                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {report.id}
                </Text>
              </View>

              <Divider style={{ marginVertical: 12 }} />

              {/* View report action */}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/report/[id]',
                    params: { id: report.id },
                  })
                }
                style={styles.actionRow}
              >
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary }}
                >
                  View report details
                </Text>

                <IconButton
                  icon="arrow-right"
                  size={19}
                  iconColor={theme.colors.primary}
                  style={{ margin: 0 }}
                />
              </Pressable>            
              </Card.Content>
          </Card>
        ))}

        <Text
          variant="bodySmall"
          style={{
            textAlign: 'center',
            color: theme.colors.onSurfaceVariant,
            marginVertical: 20,
          }}
        >
          End of reports
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  feed: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reportCard: {
    borderRadius: 18,
    marginBottom: 16,
    elevation: 1,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherInfo: {
    flex: 1,
    marginLeft: 11,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  evidence: {
    height: 180,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
