import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Button from '../../components/Button';
import { colors } from '../../constants';
import api from '../../services/api';

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRef = useRef<TextInput>(null);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, code });
      Alert.alert('Success', 'Email verified successfully.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Verification Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setCountdown(30);
      setCode('');
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Resend Failed', message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to{' '}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        <View style={styles.codeContainer}>
          <TextInput
            ref={inputRef}
            style={styles.codeInput}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.textLight}
            autoFocus
          />
        </View>

        <Text style={styles.expiry}>This code expires in 10 minutes.</Text>

        <Button
          title="Verify Email"
          onPress={handleVerify}
          loading={loading}
          disabled={code.length !== 6}
          style={styles.button}
        />

        <View style={styles.resendContainer}>
          {countdown > 0 ? (
            <Text style={styles.cooldown}>Resend code in {countdown}s</Text>
          ) : (
            <Button
              title="Resend Code"
              onPress={handleResend}
              loading={resendLoading}
              variant="outline"
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  email: {
    fontWeight: '600',
    color: colors.text,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 8,
    textAlign: 'center',
    width: '100%',
    height: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  expiry: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginBottom: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  cooldown: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
