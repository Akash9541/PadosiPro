import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Button from '../../components/Button';
import { colors } from '../../constants';
import api from '../../services/api';

interface SelectedTask {
  id: string;
  name: string;
  category: string;
}

export default function ConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskIds: string; tasks: string }>();
  const [loading, setLoading] = useState(false);

  const taskIds: string[] = JSON.parse(params.taskIds || '[]');
  const tasks: SelectedTask[] = JSON.parse(params.tasks || '[]');

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.put('/tasks/selected', { taskIds });
      router.replace('/(app)/home');
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Your selected services</Text>
          <Text style={styles.subtitle}>
            Review your selections before confirming.
          </Text>
        </View>

        {tasks.map((task) => (
          <View key={task.id} style={styles.taskItem}>
            <Text style={styles.checkmark}>✓</Text>
            <View style={styles.taskInfo}>
              <Text style={styles.taskName}>{task.name}</Text>
              <Text style={styles.taskCategory}>{task.category}</Text>
            </View>
          </View>
        ))}

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {tasks.length} service{tasks.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Edit Selection"
          onPress={() => router.back()}
          variant="outline"
          style={styles.editButton}
        />
        <Button
          title="Confirm"
          onPress={handleConfirm}
          loading={loading}
          style={styles.confirmButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkmark: {
    fontSize: 18,
    color: colors.success,
    fontWeight: '700',
    marginRight: 14,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  taskCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  editButton: {
    marginBottom: 0,
  },
  confirmButton: {
    marginBottom: 0,
  },
});
