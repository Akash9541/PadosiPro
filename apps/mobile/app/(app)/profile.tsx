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

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  address: z.string().min(1, 'Address is required'),
  businessName: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const router = useRouter();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', mobileNumber: '', address: '', businessName: '' },
  });

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      await api.put('/profile', data);
      updateUser({ profileCompleted: true });
      router.replace('/(app)/tasks');
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Error', message);
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
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            Tell us a bit about yourself so your Lifestyle Manager can serve you best
          </Text>
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full Name"
              placeholder="John Doe"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="mobileNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Mobile Number"
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={10}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.mobileNumber?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Delivery Address"
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top', paddingTop: 12 }}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.address?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="businessName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Business Name (Optional)"
              placeholder="e.g., Acme Inc"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Button
          title="Save & Continue"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.button}
        />
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
});
