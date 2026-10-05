import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { SelectedTask } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [tasks, setTasks] = useState<SelectedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSelectedTasks = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get<{ success: boolean; data: SelectedTask[] }>('/tasks/selected');
      setTasks(res.data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSelectedTasks();
  }, [fetchSelectedTasks]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Something went wrong.</Text>
        <TouchableOpacity onPress={fetchSelectedTasks} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your selected services</Text>

      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No services selected yet.</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => router.push('/(app)/tasks')}
          >
            <Text style={styles.selectButtonText}>Select Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <Text style={styles.taskName}>{item.name}</Text>
              <Text style={styles.taskCategory}>{item.category}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  taskCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginBottom: 10,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  selectButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
});
