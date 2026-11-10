
import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';

import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  ProgressBar,
  useTheme,
  Divider,
  RadioButton,
} from 'react-native-paper';
import api from '@/lib/api';

import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

type IdentificationMethod = 'id_card' | 'no_id' | null;

const categories = [
  'CLASSROOM_DISRUPTION',
  'MISCONDUCT',
  'PROPERTY_DAMAGE',
  'BULLYING',
  'INDISCIPLINE',
  'OTHER',
];

export default function ReportScreen() {
  const theme = useTheme();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Identification
  const [method, setMethod] = useState<IdentificationMethod>(null);
  const [usn, setUsn] = useState('');
  const [studentName, setStudentName] = useState('');
  const [verified, setVerified] = useState(false);

  // Unidentified person
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [personDescription, setPersonDescription] = useState('');

  // Incident details
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Additional evidence
  const [evidence, setEvidence] = useState<string[]>([]);

  const takePhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Camera permission required',
        'Please allow camera access to capture a photograph.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPersonPhoto(result.assets[0].uri);
    }
  };

  const pickEvidence = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setEvidence(previous => [
        ...previous,
        ...result.assets.map(asset => asset.uri),
      ]);
    }
  };

  const captureEvidence = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Camera permission required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setEvidence(previous => [
        ...previous,
        result.assets[0].uri,
      ]);
    }
  };

  // Demo lookup only. Real verification requires the backend.
  const verifyStudent = () => {
    if (!usn.trim()) {
      Alert.alert('Enter USN', 'Please enter the student USN.');
      return;
    }

    setStudentName('');
    setVerified(true);
  };
  const canContinue = () => {
    if (step === 1) {
      return method !== null;
    }

    if (step === 2) {
      if (method === 'id_card') {
        return verified;
      }

      return personDescription.trim().length > 0;
    }

    if (step === 3) {
      return (
        category !== '' &&
        location.trim().length > 0 &&
        description.trim().length > 0
      );
    }

    return true;
  };

  const nextStep = () => {
    if (!canContinue()) {
      Alert.alert(
        'Incomplete information',
        'Please complete the required fields before continuing.'
      );
      return;
    }

    setStep(previous => Math.min(previous + 1, 5));
  };

  const previousStep = () => {
    setStep(previous => Math.max(previous - 1, 1));
  };

  const resetForm = () => {
    setStep(1);
    setMethod(null);
    setUsn('');
    setStudentName('');
    setVerified(false);
    setPersonPhoto(null);
    setPersonDescription('');
    setCategory('');
    setLocation('');
    setDescription('');
    setEvidence([]);
  };

  const submitReport = async () => {
    if (isSubmitting) return;

    if (!method) {
      Alert.alert('Missing information', 'Select an identification method.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        category,
        location: location.trim(),
        description: description.trim(),
        identificationMethod:
          method === 'id_card' ? 'ID_CARD' : 'NO_ID',

        ...(method === 'id_card'
          ? {
            student: {
              usn: usn.trim(),
            },
          }
          : {
            personDescription: personDescription.trim(),
          }),
      };

      const response = await api.post('/reports', payload);

      Alert.alert(
        'Report submitted',
        `Report number: ${response.data.report.reportNumber}`,
        [
          {
            text: 'OK',
            onPress: resetForm,
          },
        ]
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Could not submit the report. Please check your connection and try again.';

      Alert.alert('Submission failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    'Identify student',
    'Student information',
    'Incident details',
    'Evidence',
    'Review report',
  ];

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
          Report an incident
        </Text>

        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Step {step} of 5 · {stepTitles[step - 1]}
        </Text>

        <ProgressBar
          progress={step / 5}
          color={theme.colors.primary}
          style={styles.progress}
        />

        {/* STEP 1: IDENTIFICATION METHOD */}

        {step === 1 && (
          <>
            <Text variant="titleLarge" style={styles.sectionHeading}>
              Identify the student
            </Text>

            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Choose how you want to identify the person involved.
            </Text>

            <Card
              style={[
                styles.optionCard,
                {
                  backgroundColor:
                    method === 'id_card'
                      ? theme.colors.secondaryContainer
                      : theme.colors.surface,
                  borderColor:
                    method === 'id_card'
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                },
              ]}
              onPress={() => {
                setMethod('id_card');
                setVerified(false);
              }}
            >
              <Card.Content>
                <View style={styles.optionHeader}>
                  <Text variant="titleMedium">ID card available</Text>
                  <RadioButton
                    value="id_card"
                    status={method === 'id_card' ? 'checked' : 'unchecked'}
                    onPress={() => {
                      setMethod('id_card');
                      setVerified(false);
                    }}
                  />
                </View>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Enter the student's USN and retrieve their details.
                </Text>
              </Card.Content>
            </Card>

            <Card
              style={[
                styles.optionCard,
                {
                  backgroundColor:
                    method === 'no_id'
                      ? theme.colors.secondaryContainer
                      : theme.colors.surface,
                  borderColor:
                    method === 'no_id'
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                },
              ]}
              onPress={() => {
                setMethod('no_id');
                setVerified(false);
              }}
            >
              <Card.Content>
                <View style={styles.optionHeader}>
                  <Text variant="titleMedium">No ID card available</Text>
                  <RadioButton
                    value="no_id"
                    status={method === 'no_id' ? 'checked' : 'unchecked'}
                    onPress={() => {
                      setMethod('no_id');
                      setVerified(false);
                    }}
                  />
                </View>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Capture a photograph and provide a description.
                </Text>
              </Card.Content>
            </Card>
          </>
        )}

        {/* STEP 2: IDENTIFICATION DETAILS */}

        {step === 2 && method === 'id_card' && (
          <>
            <Text variant="titleLarge" style={styles.sectionHeading}>
              Student verification
            </Text>

            <TextInput
              label="Student USN"
              value={usn}
              onChangeText={value => {
                setUsn(value);
                setVerified(false);
                setStudentName('');
              }}
              mode="outlined"
              autoCapitalize="characters"
              style={styles.input}
              placeholder="Enter student USN"
            />

            <Button
              mode="contained-tonal"
              onPress={verifyStudent}
              style={styles.button}
              disabled={!usn.trim()}
            >
              Verify student
            </Button>

            {verified && (
              <Card
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Card.Content>
                  <Chip
                    icon="check-circle"
                    style={styles.chip}
                    textStyle={{ color: theme.colors.onSurface }}
                  >
                    Demo verification successful
                  </Chip>

                  <Text variant="titleMedium">
                    {studentName}
                  </Text>

                  <Text variant="bodyMedium">
                    USN: {usn}
                  </Text>

                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    This is placeholder data. Actual student lookup will
                    be connected to your backend.
                  </Text>
                </Card.Content>
              </Card>
            )}
          </>
        )}

        {step === 2 && method === 'no_id' && (
          <>
            <Text variant="titleLarge" style={styles.sectionHeading}>
              Unidentified person
            </Text>

            <Chip
              icon="alert-circle-outline"
              style={styles.chip}
            >
              Identity not verified
            </Chip>

            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Capture a photograph if appropriate and permitted by
              your institution's policy.
            </Text>

            {personPhoto ? (
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: personPhoto }}
                  style={styles.photo}
                />

                <Button
                  mode="outlined"
                  onPress={takePhoto}
                  style={styles.button}
                >
                  Retake photograph
                </Button>

                <Button
                  mode="text"
                  textColor={theme.colors.error}
                  onPress={() => setPersonPhoto(null)}
                >
                  Remove photograph
                </Button>
              </View>
            ) : (
              <Button
                mode="contained-tonal"
                icon="camera"
                onPress={takePhoto}
                style={styles.photoButton}
                contentStyle={{ height: 110 }}
              >
                Capture photograph
              </Button>
            )}

            <TextInput
              label="Description of the person"
              value={personDescription}
              onChangeText={setPersonDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Describe identifying details or information that may help the committee identify the person."
            />
          </>
        )}

        {/* STEP 3: INCIDENT DETAILS */}

        {step === 3 && (
          <>
            <Text variant="titleLarge" style={styles.sectionHeading}>
              Incident details
            </Text>

            <Text variant="titleSmall" style={styles.label}>
              Incident category
            </Text>

            <View style={styles.chipContainer}>
              {categories.map(item => (
                <Chip
                  key={item.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}
                  selected={category === item}
                  onPress={() => setCategory(item)}
                  style={styles.categoryChip}
                >
                  {item.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Incident location"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
              placeholder="e.g. Block A, Room 204"
            />

            <TextInput
              label="Describe what happened"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={styles.input}
              placeholder="Provide a factual description of the incident."
            />
          </>
        )}

        {/* STEP 4: ADDITIONAL EVIDENCE */}

        {step === 4 && (
          <>
            <Text variant="titleLarge" style={styles.sectionHeading}>
              Additional evidence
            </Text>

            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Add photographs or other supporting images if available.
              This step is optional.
            </Text>

            <View style={styles.buttonRow}>
              <Button
                mode="contained-tonal"
                icon="camera"
                onPress={captureEvidence}
                style={styles.flexButton}
              >
                Camera
              </Button>

              <Button
                mode="contained-tonal"
                icon="image"
                onPress={pickEvidence}
                style={styles.flexButton}
              >
                Gallery
              </Button>
            </View>

            {evidence.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.evidenceItem}>
                <Image
                  source={{ uri }}
                  style={styles.evidenceThumbnail}
                />

                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">
                    Evidence {index + 1}
                  </Text>
                </View>

                <Button
                  compact
                  textColor={theme.colors.error}
                  onPress={() =>
                    setEvidence(previous =>
                      previous.filter((_, i) => i !== index)
                    )
                  }
                >
                  Remove
                </Button>
              </View>
            ))}
          </>
        )}

        {/* STEP 5: REVIEW */}

        {step === 5 && (
          <>
            <Text variant="titleLarge" style={styles.sectionHeading}>
              Review report
            </Text>

            <Card
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content>
                <Text variant="titleMedium">
                  Student identification
                </Text>

                {method === 'id_card' ? (
                  <>
                    <Text variant="bodyMedium">
                      Name: {studentName}
                    </Text>
                    <Text variant="bodyMedium">
                      USN: {usn}
                    </Text>
                    <Chip icon="check-circle" style={styles.chip}>
                      Demo verified
                    </Chip>
                  </>
                ) : (
                  <>
                    <Text variant="bodyMedium">
                      Identification method: No ID card
                    </Text>
                    <Chip icon="alert-circle-outline" style={styles.chip}>
                      Identity unverified
                    </Chip>
                    <Text variant="bodyMedium">
                      Description: {personDescription}
                    </Text>
                    {personPhoto && (
                      <Image
                        source={{ uri: personPhoto }}
                        style={styles.reviewPhoto}
                      />
                    )}
                  </>
                )}

                <Divider style={styles.divider} />

                <Text variant="titleMedium">
                  Incident information
                </Text>
                <Text variant="bodyMedium">
                  Category: {category}
                </Text>
                <Text variant="bodyMedium">
                  Location: {location}
                </Text>
                <Text variant="bodyMedium">
                  Description: {description}
                </Text>

                <Divider style={styles.divider} />

                <Text variant="titleMedium">
                  Additional evidence
                </Text>
                <Text variant="bodyMedium">
                  {evidence.length} image(s) attached
                </Text>
              </Card.Content>
            </Card>

            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Submitting a report does not establish that misconduct
              occurred. The committee must review the information.
            </Text>
          </>
        )}

        {/* NAVIGATION */}

        <Divider style={styles.divider} />

        <View style={styles.navigation}>
          {step > 1 && (
            <Button
              mode="outlined"
              onPress={previousStep}
              style={styles.flexButton}
            >
              Back
            </Button>
          )}

          {step < 5 ? (
            <Button
              mode="contained"
              onPress={nextStep}
              disabled={!canContinue()}
              style={styles.flexButton}
            >
              Continue
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={submitReport}
              style={styles.flexButton}
              icon="send"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit report'}
            </Button>
          )}
        </View>
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
    paddingBottom: 40,
  },
  heading: {
    fontWeight: '600',
    marginBottom: 8,
  },
  progress: {
    height: 6,
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 24,
  },
  sectionHeading: {
    marginBottom: 12,
    fontWeight: '600',
  },
  optionCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 0,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    marginTop: 16,
  },
  button: {
    marginTop: 14,
  },
  photoButton: {
    marginTop: 18,
    borderRadius: 16,
  },
  photoContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  reviewPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
  card: {
    borderRadius: 18,
    marginTop: 18,
    elevation: 0,
  },
  chip: {
    alignSelf: 'flex-start',
    marginVertical: 12,
  },
  label: {
    marginTop: 18,
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  flexButton: {
    flex: 1,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  evidenceThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  divider: {
    marginVertical: 22,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
