import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  ProgressBar,
  useTheme,
  IconButton,
  Divider,
} from 'react-native-paper';

import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories = [
  'Misconduct',
  'Classroom Disruption',
  'Property Damage',
  'Ragging / Harassment',
  'Attendance-related Issues',
  'Other',
];

export default function ReportScreen() {
  const theme = useTheme();

  const [step, setStep] = useState(1);
  const [usn, setUsn] = useState('');
  const [studentName, setStudentName] = useState('');
  const [verified, setVerified] = useState(false);

  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);

  const pickEvidence = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setEvidence((previous) => [
        ...previous,
        ...result.assets.map((asset) => asset.uri),
      ]);
    }
  };

  const captureEvidence = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setEvidence((previous) => [
        ...previous,
        result.assets[0].uri,
      ]);
    }
  };

  const verifyStudent = () => {
    if (!usn.trim()) return;

    // Temporary mock verification.
    setStudentName('Sample Student');
    setVerified(true);
  };

  const nextStep = () => {
    setStep((previous) => Math.min(previous + 1, 5));
  };

  const previousStep = () => {
    setStep((previous) => Math.max(previous - 1, 1));
  };

  const submitReport = () => {
    // Backend submission will be implemented later.
    alert('Demo report submitted successfully!');
    setStep(1);
    setUsn('');
    setStudentName('');
    setVerified(false);
    setCategory('');
    setLocation('');
    setDescription('');
    setEvidence([]);
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return usn.trim().length > 0;
      case 2:
        return verified;
      case 3:
        return category !== '' &&
          location.trim() !== '' &&
          description.trim() !== '';
      case 4:
        return true;
      default:
        return true;
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.heading}>
              New report
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Document a disciplinary incident
            </Text>
          </View>

          <Chip compact>
            Step {step} of 5
          </Chip>
        </View>

        <ProgressBar
          progress={step / 5}
          color={theme.colors.primary}
          style={styles.progress}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <View>
              <Text variant="titleLarge">Identify student</Text>
              <Text style={styles.subtitle}>
                Enter the student's university seat number.
              </Text>

              <Card style={styles.card}>
                <Card.Content>
                  <TextInput
                    label="Student USN"
                    value={usn}
                    onChangeText={(value) => {
                      setUsn(value);
                      setVerified(false);
                    }}
                    mode="outlined"
                    autoCapitalize="characters"
                    placeholder="e.g. 1KS25CS007"
                  />

                  <Button
                    mode="contained-tonal"
                    icon="card-account-details-outline"
                    style={styles.button}
                    onPress={verifyStudent}
                  >
                    Verify student (Demo)
                  </Button>
                </Card.Content>
              </Card>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text variant="titleLarge">Verify student details</Text>
              <Text style={styles.subtitle}>
                Confirm that the student information is correct.
              </Text>

              <Card style={styles.card}>
                <Card.Content>
                  <TextInput
                    label="Student name"
                    value={studentName}
                    onChangeText={setStudentName}
                    mode="outlined"
                  />

                  <TextInput
                    label="Student USN"
                    value={usn}
                    onChangeText={setUsn}
                    mode="outlined"
                    style={styles.input}
                  />

                  <Button
                    mode={verified ? 'contained' : 'outlined'}
                    icon="check-circle-outline"
                    onPress={() => setVerified(true)}
                    style={styles.button}
                  >
                    {verified ? 'Details verified' : 'Confirm details'}
                  </Button>
                </Card.Content>
              </Card>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text variant="titleLarge">Incident details</Text>
              <Text style={styles.subtitle}>
                Provide the details of the incident.
              </Text>

              <Text variant="titleSmall" style={styles.fieldTitle}>
                Incident category
              </Text>

              <View style={styles.categories}>
                {categories.map((item) => (
                  <Chip
                    key={item}
                    selected={category === item}
                    onPress={() => setCategory(item)}
                    showSelectedCheck
                  >
                    {item}
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
                label="Incident description"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={5}
                style={styles.input}
                placeholder="Describe what happened..."
              />
            </View>
          )}

          {step === 4 && (
            <View>
              <Text variant="titleLarge">Attach evidence</Text>
              <Text style={styles.subtitle}>
                Add photographs related to the incident.
              </Text>

              <Card style={styles.card}>
                <Card.Content>
                  <Button
                    mode="contained"
                    icon="camera"
                    onPress={captureEvidence}
                    style={styles.button}
                  >
                    Take photograph
                  </Button>

                  <Button
                    mode="outlined"
                    icon="image-multiple-outline"
                    onPress={pickEvidence}
                    style={styles.button}
                  >
                    Choose from gallery
                  </Button>

                  <Text
                    variant="bodyMedium"
                    style={styles.evidenceCount}
                  >
                    {evidence.length} image(s) selected
                  </Text>

                  {evidence.map((uri, index) => (
                    <View key={`${uri}-${index}`} style={styles.evidenceRow}>
                      <Text
                        variant="bodySmall"
                        numberOfLines={1}
                        style={{ flex: 1 }}
                      >
                        Evidence {index + 1}
                      </Text>

                      <IconButton
                        icon="delete-outline"
                        onPress={() =>
                          setEvidence((previous) =>
                            previous.filter((_, i) => i !== index)
                          )
                        }
                      />
                    </View>
                  ))}
                </Card.Content>
              </Card>
            </View>
          )}

          {step === 5 && (
            <View>
              <Text variant="titleLarge">Review report</Text>
              <Text style={styles.subtitle}>
                Verify everything before submitting.
              </Text>

              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium">Student information</Text>
                  <Text>Name: {studentName}</Text>
                  <Text>USN: {usn}</Text>

                  <Divider style={styles.divider} />

                  <Text variant="titleMedium">Incident</Text>
                  <Text>Category: {category}</Text>
                  <Text>Location: {location}</Text>
                  <Text style={styles.description}>
                    {description}
                  </Text>

                  <Divider style={styles.divider} />

                  <Text variant="titleMedium">Evidence</Text>
                  <Text>{evidence.length} photograph(s) attached</Text>

                  <Divider style={styles.divider} />

                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    This report will be submitted for human review.
                    Submission does not establish guilt or automatically
                    issue a disciplinary warning.
                  </Text>
                </Card.Content>
              </Card>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <Button
              mode="outlined"
              onPress={previousStep}
              style={styles.footerButton}
            >
              Back
            </Button>
          )}

          {step < 5 ? (
            <Button
              mode="contained"
              onPress={nextStep}
              disabled={!canContinue()}
              style={styles.footerButton}
            >
              Continue
            </Button>
          ) : (
            <Button
              mode="contained"
              icon="send"
              onPress={submitReport}
              style={styles.footerButton}
            >
              Submit report
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontWeight: '700',
  },
  progress: {
    height: 4,
    marginHorizontal: 18,
    borderRadius: 4,
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: '#888888',
  },
  card: {
    borderRadius: 16,
    marginTop: 8,
  },
  button: {
    marginTop: 12,
  },
  input: {
    marginTop: 14,
  },
  fieldTitle: {
    marginBottom: 12,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  evidenceCount: {
    marginTop: 20,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  description: {
    marginTop: 10,
    lineHeight: 22,
  },
  divider: {
    marginVertical: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
