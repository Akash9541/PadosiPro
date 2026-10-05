import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors } from '../../constants';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { LoginResponse } from '../../types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await api.post<{ success: boolean; data: LoginResponse }>(
        '/auth/login',
        data
      );
      const { token, user } = response.data.data;
      await login(token, user);

      if (!user.profileCompleted) {
        router.replace('/(app)/profile');
      } else {
        router.replace('/(app)/home');
      }
    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code;
      const message =
        error.response?.data?.error?.message || 'Something went wrong. Please try again.';

      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        Alert.alert('Email Not Verified', message, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Verify Now',
            onPress: () =>
              router.push({
                pathname: '/(auth)/verify',
                params: { email: getValues('email') },
              }),
          },
        ]);
      } else {
        Alert.alert('Login Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to manage your household and concierge tasks
          </Text>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          title="Sign In"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.button}
        />

        <Text style={styles.footer}>
          Don't have an account?{' '}
          <Text
            style={styles.link}
            onPress={() => router.replace('/(auth)/register')}
          >
            Sign Up
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
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
  button: {
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
    color: colors.textSecondary,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
