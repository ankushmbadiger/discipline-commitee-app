
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  useTheme,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';

interface StudentCase {
  id: string;
  identityStatus: string;
  description: string | null;
  appeals: {
    id: string;
    status: string;
    createdAt: string;
  }[];
  report: {
    id: string;
    reportNumber: string;
    category: string;
    status: string;
    incidentAt: string | null;
    createdAt: string;
    location: string | null;
  };
}

export default function MyCasesScreen() {
  const theme = useTheme();
  const { profile } = useAuth();

  const [cases, setCases] = useState<StudentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setError(null);

      const response = await api.get('/auth/student/cases');

      setCases(response.data.data.cases);
    } catch (err) {
      setError('Unable to load your cases. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const formatLabel = (value: string) =>
    value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const statusColor =
    theme.colors.secondaryContainer;

  if (!profile?.student) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.center}>
          <Text variant="titleMedium">Verification pending</Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            Your student identity must be approved before you can access your cases.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall">My Cases</Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {profile.student.usn}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12 }}>Loading your cases...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text variant="bodyLarge">{error}</Text>
          <Chip
            style={{ marginTop: 16 }}
            onPress={fetchCases}
          >
            Try again
          </Chip>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchCases();
              }}
            />
          }
        >
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}
          >
            Cases associated with your verified student record.
          </Text>

          {cases.length === 0 ? (
            <Card style={styles.card}>
              <Card.Content style={styles.empty}>
                <Text variant="titleMedium">No cases found</Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textAlign: 'center',
                  }}
                >
                  There are currently no reports associated with your student record.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            cases.map((item) => (
              <Card key={item.id} style={styles.card}>
                <Card.Content>
                  <View style={styles.row}>
                    <Text
                      variant="labelLarge"
                      style={{ color: theme.colors.primary }}
                    >
                      {item.report.reportNumber}
                    </Text>

                    <Chip compact style={{ backgroundColor: statusColor }}>
                      {formatLabel(item.report.status)}
                    </Chip>
                  </View>

                  <Text variant="titleMedium" style={styles.category}>
                    {formatLabel(item.report.category)}
                  </Text>

                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Reported on {formatDate(item.report.createdAt)}
                  </Text>

                  {item.report.location ? (
                    <Text variant="bodyMedium" style={styles.location}>
                      Location: {item.report.location}
                    </Text>
                  ) : null}

                  <Divider style={{ marginVertical: 12 }} />

                  <Text variant="labelMedium">Identity status</Text>
                  <Text variant="bodyMedium">
                    {formatLabel(item.identityStatus)}
                  </Text>

                  <View style={styles.appealRow}>
                    <Text variant="labelMedium">Appeals</Text>
                    <Text variant="bodyMedium">
                      {item.appeals.length}
                    </Text>
                  </View>

                  {item.appeals.length > 0 && (
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Latest appeal: {formatLabel(item.appeals[0].status)}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ))
          )}

          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
              marginVertical: 20,
            }}
          >
            A report is an allegation for review, not a finding of guilt.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  card: {
    marginBottom: 14,
    borderRadius: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    marginTop: 12,
    marginBottom: 5,
  },
  location: {
    marginTop: 10,
  },
  appealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
