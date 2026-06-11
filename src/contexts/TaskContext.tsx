import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// Types
export type TaskStatus = 'active' | 'completed' | 'cancelled' | 'error';

export interface Task {
  id: string;
  name: string;
  process: string;
  progress: number;
  status: TaskStatus;
  startedAt: Date;
  completedAt?: Date;
  onCancel?: () => void;
}

interface TaskContextType {
  tasks: Task[];
  activeTasks: Task[];
  completedTasks: Task[];
  activeCount: number;
  addTask: (name: string, onCancel?: () => void) => string;
  updateTask: (id: string, update: { process?: string; progress?: number }) => void;
  completeTask: (id: string) => void;
  cancelTask: (id: string) => void;
  failTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

const MAX_COMPLETED_TASKS = 20;

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const idCounter = useRef(0);

  const addTask = useCallback((name: string, onCancel?: () => void): string => {
    const id = `task-${++idCounter.current}`;
    const task: Task = {
      id,
      name,
      process: '',
      progress: 0,
      status: 'active',
      startedAt: new Date(),
      onCancel,
    };
    setTasks(prev => [task, ...prev]);
    return id;
  }, []);

  const updateTask = useCallback((id: string, update: { process?: string; progress?: number }) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...update } : t
    ));
  }, []);

  const completeTask = useCallback((id: string) => {
    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === id ? { ...t, status: 'completed' as TaskStatus, progress: 100, completedAt: new Date() } : t
      );
      const completed = updated.filter(t => t.status === 'completed');
      const active = updated.filter(t => t.status === 'active');
      if (completed.length > MAX_COMPLETED_TASKS) {
        return [...active, ...completed.slice(0, MAX_COMPLETED_TASKS)];
      }
      return updated;
    });
  }, []);

  const cancelTask = useCallback((id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task && task.status === 'active') {
        if (task.onCancel) {
          try {
            task.onCancel();
          } catch (e) {
            console.error('Error in task cancel handler:', e);
          }
        }
        return prev.map(t =>
          t.id === id ? { ...t, status: 'cancelled' as TaskStatus, completedAt: new Date() } : t
        );
      }
      return prev;
    });
  }, []);

  const failTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: 'error' as TaskStatus, completedAt: new Date() } : t
    ));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => t.status === 'active'));
  }, []);

  const activeTasks = tasks.filter(t => t.status === 'active');
  const completedTasks = tasks.filter(t => t.status !== 'active');
  const activeCount = activeTasks.length;

  return (
    <TaskContext.Provider
      value={{
        tasks,
        activeTasks,
        completedTasks,
        activeCount,
        addTask,
        updateTask,
        completeTask,
        cancelTask,
        failTask,
        removeTask,
        clearCompleted,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
