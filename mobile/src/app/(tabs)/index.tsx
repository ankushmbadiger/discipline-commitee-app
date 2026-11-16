
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  Image,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  Card,
  Avatar,
  Chip,
  IconButton,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { useAuth } from '../../context/auth-context';
type Evidence = {
  id: string;
  kind: 'IDENTIFICATION' | 'INCIDENT';
  filename: string;
  mimeType: string;
  url: string;
};

type Report = {
  id: string;
  createdById: string;
  reportNumber: string;
  category: string;
  description: string;
  location: string | null;
  status: string;
  createdAt: string;
  teacher: string;
  teacherRole: string;
  college: string;
  evidence: Evidence[];
};

export default function HomeScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  //     console.log('Delete visibility debug:', {
  //     profileId: profile?.id,
  //     role: profile?.role,
  //     firstReportCreatorId: reports[0]?.createdById,
  // });

  const fetchReports = useCallback(async () => {
    try {
      setError('');

      const response = await api.get('/reports');

      setReports(response.data.reports ?? []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Unable to load reports. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleDeleteReport = (report: Report) => {
    Alert.alert(
      'Delete report?',
      `Are you sure you want to delete report ${report.reportNumber}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingReportId(report.id);

              await api.delete(`/reports/${report.id}`);

              setReports((previousReports) =>
                previousReports.filter(
                  (item) => item.id !== report.id
                )
              );
            } catch (error: any) {
              Alert.alert(
                'Unable to delete report',
                error.response?.data?.message ||
                'Something went wrong. Please try again.'
              );
            } finally {
              setDeletingReportId(null);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      CLASSROOM_DISRUPTION: 'Classroom Disruption',
      MISCONDUCT: 'Misconduct',
      PROPERTY_DAMAGE: 'Property Damage',
      BULLYING: 'Bullying',
      INDISCIPLINE: 'Indiscipline',
      OTHER: 'Other',
    };

    return labels[category] ?? category;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SUBMITTED: 'Submitted',
      UNDER_REVIEW: 'Under Review',
      AWAITING_STUDENT_RESPONSE: 'Awaiting Response',
      RESOLVED: 'Resolved',
      DISMISSED: 'Dismissed',
    };

    return labels[status] ?? status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return theme.colors.primary;
      case 'UNDER_REVIEW':
        return theme.colors.tertiary;
      case 'DISMISSED':
        return theme.colors.error;
      default:
        return theme.colors.secondary;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      edges={['top']}
    >
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

        {/* <IconButton
          icon="bell-outline"
          size={25}
          onPress={() => { }}
          mode="outlined"
          accessibilityLabel="Notifications"
        /> */}
      </View>

      <Divider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feed}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
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

        {loading ? (
          <View style={styles.messageContainer}>
            <ActivityIndicator size="large" />
            <Text
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 12,
              }}
            >
              Loading reports...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.messageContainer}>
            <Text style={{ color: theme.colors.error }}>
              {error}
            </Text>

            <Pressable onPress={fetchReports} style={styles.retryButton}>
              <Text style={{ color: theme.colors.primary }}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.messageContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No reports have been submitted yet.
            </Text>
          </View>
        ) : (
          reports.map(report => (
            <Card
              key={report.id}
              mode="elevated"
              style={[
                styles.reportCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.teacherRow}>
                  <Avatar.Text
                    size={44}
                    label={getInitials(report.teacher)}
                    style={{
                      backgroundColor: theme.colors.secondaryContainer,
                    }}
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
                      {report.college} · {formatDate(report.createdAt)}
                    </Text>
                  </View>

                  {profile &&
                    (profile.role === 'PLATFORM_ADMIN' ||
                      (profile.role === 'COMMITTEE_MEMBER' &&
                        profile.id === report.createdById)) && (
                      deletingReportId === report.id ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <IconButton
                          icon="delete-outline"
                          size={21}
                          onPress={() => handleDeleteReport(report)}
                        />
                      )
                    )}
                </View>

                <View style={styles.chipRow}>
                  <Chip
                    compact
                    style={{
                      backgroundColor: theme.colors.secondaryContainer,
                    }}
                    textStyle={{
                      color: theme.colors.onSecondaryContainer,
                      fontSize: 11,
                    }}
                  >
                    {getCategoryLabel(report.category)}
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
                    {getStatusLabel(report.status)}
                  </Chip>
                </View>

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


                {report.evidence.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.evidenceList}
                    // contentContainerStyle={styles.evidenceContent}
                  >
                    {report.evidence.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => setSelectedImage(item.url)}
                      >
                        <Image
                          source={{ uri: item.url }}
                          style={styles.evidenceImage}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
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
                      No evidence images
                    </Text>
                  </View>
                )}

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
                      {report.location || 'Location not specified'}
                    </Text>
                  </View>

                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {report.reportNumber}
                  </Text>
                </View>

              </Card.Content>
            </Card>
          ))
        )}

        {!loading && !error && reports.length > 0 && (
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
        )}
      </ScrollView>
      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageModalContainer}>
          <Pressable
            style={styles.imageModalClose}
            onPress={() => setSelectedImage(null)}
          >
            <IconButton
              icon="close"
              iconColor="#FFFFFF"
              size={28}
            />
          </Pressable>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    flexGrow: 1,
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
  evidenceList: {
    marginTop: 14,
  },
  evidenceImage: {
    width: 280,
    height: 180,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#dddddd',
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
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  retryButton: {
    marginTop: 16,
    padding: 10,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 40,
    right: 12,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
  },
  fullScreenImage: {
    width: '100%',
    height: '85%',
  },
  evidenceContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardContent: {
  paddingHorizontal: 14,
  paddingVertical: 12,
},
});
