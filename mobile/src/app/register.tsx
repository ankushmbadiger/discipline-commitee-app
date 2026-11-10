import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";

import { registerStudent } from "@/lib/registration";

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [usn, setUsn] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");

  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function handleRegister() {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !collegeCode.trim() ||
      !usn.trim()
    ) {
      Alert.alert("Missing information", "Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid password",
        "Your password must contain at least 6 characters."
      );
      return;
    }

    const semesterNumber = semester.trim()
      ? Number(semester.trim())
      : undefined;

    if (
      semesterNumber !== undefined &&
      (!Number.isInteger(semesterNumber) ||
        semesterNumber < 1 ||
        semesterNumber > 12)
    ) {
      Alert.alert("Invalid semester", "Enter a semester between 1 and 12.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerStudent({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        collegeCode: collegeCode.trim(),
        usn: usn.trim(),
        department: department.trim() || undefined,
        semester: semesterNumber,
      });

      Alert.alert(
        "Registration submitted",
        "Your account has been created. Your student identity is awaiting administrator verification.",
        [
          {
            text: "Continue",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Please try again.";

      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Create account
          </Text>

          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Register with your college details. Your identity will be
            manually verified by the administrator.
          </Text>
        </View>

        <TextInput
          label="Full name *"
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          autoCapitalize="words"
          style={styles.input}
        />

        <TextInput
          label="Email address *"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <TextInput
          label="Password *"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!passwordVisible}
          autoCapitalize="none"
          right={
            <TextInput.Icon
              icon={passwordVisible ? "eye-off" : "eye"}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          }
          style={styles.input}
        />

        <TextInput
          label="College code *"
          value={collegeCode}
          onChangeText={setCollegeCode}
          mode="outlined"
          autoCapitalize="characters"
          style={styles.input}
        />

        <TextInput
          label="USN *"
          value={usn}
          onChangeText={setUsn}
          mode="outlined"
          autoCapitalize="characters"
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
          label="Semester"
          value={semester}
          onChangeText={setSemester}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
        />

        <Text
          variant="bodySmall"
          style={[
            styles.note,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          * Required fields. Your USN and name will be reviewed before you
          can access your cases or submit appeals.
        </Text>

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Create account
        </Button>

        <Button
          mode="text"
          onPress={() => router.replace("/" as never)}
          disabled={loading}
        >
          Already have an account? Sign in
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
    gap: 8,
  },
  title: {
    fontWeight: "700",
  },
  input: {
    marginBottom: 14,
  },
  note: {
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonContent: {
    height: 48,
  },
});