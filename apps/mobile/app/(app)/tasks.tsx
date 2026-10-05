import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants';
import api from '../../services/api';
import { Category, Task } from '../../types';

export default function TasksScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get<{ success: boolean; data: Category[] }>('/tasks');
      setCategories(res.data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Filter tasks by search
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      tasks: cat.tasks.filter(
        (task) =>
          task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.tasks.length > 0);

  const handleContinue = () => {
    if (selectedIds.size === 0) {
      Alert.alert('No Tasks Selected', 'Please select at least one task.');
      return;
    }

    // Find selected task details for the confirmation screen
    const selectedTasks: (Task & { category: string })[] = [];
    for (const cat of categories) {
      for (const task of cat.tasks) {
        if (selectedIds.has(task.id)) {
          selectedTasks.push({ ...task, category: cat.name });
        }
      }
    }

    router.push({
      pathname: '/(app)/confirm',
      params: {
        taskIds: JSON.stringify(Array.from(selectedIds)),
        tasks: JSON.stringify(selectedTasks),
      },
    });
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
        <TouchableOpacity onPress={fetchTasks} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What can we help you with?</Text>
        <Text style={styles.subtitle}>
          Choose the services you need. Your Lifestyle Manager will take care of the rest.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: category }) => (
          <View style={styles.categorySection}>
            <Text style={styles.categoryName}>{category.name.toUpperCase()}</Text>
            {category.tasks.map((task) => {
              const isSelected = selectedIds.has(task.id);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskCard, isSelected && styles.taskCardSelected]}
                  onPress={() => toggleTask(task.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskName, isSelected && styles.taskNameSelected]}>
                      {task.name}
                    </Text>
                    <Text style={styles.taskDesc}>{task.description}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No tasks found.</Text>
          </View>
        }
      />

      {selectedIds.size > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedCount}>
            {selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
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
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  categorySection: {
    marginTop: 20,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginBottom: 10,
  },
  taskCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  taskNameSelected: {
    color: colors.primaryDark,
  },
  taskDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 32,
  },
  selectedCount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  continueText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
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
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
