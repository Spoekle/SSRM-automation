import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTasks, FaStop, FaCheck, FaTimes, FaExclamationTriangle, FaBan, FaTrash, FaSpinner } from 'react-icons/fa';
import { useTasks } from '../../contexts/TaskContext';
import type { TaskStatus } from '../../contexts/TaskContext';

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return <FaCheck className="text-green-500" size={10} />;
    case 'cancelled':
      return <FaBan className="text-neutral-400" size={10} />;
    case 'error':
      return <FaExclamationTriangle className="text-red-500" size={10} />;
    default:
      return null;
  }
};

const TaskDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeTasks, completedTasks, activeCount, cancelTask, clearCompleted } = useTasks();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative no-drag">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-lg hover:bg-neutral-400/20 dark:hover:bg-neutral-700/50 transition-all duration-200 relative flex items-center justify-center cursor-pointer"
        title="Tasks"
      >
        {activeCount > 0 ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <FaSpinner className="text-blue-500" size={16} />
          </motion.div>
        ) : (
          <FaTasks className="text-neutral-500 dark:text-neutral-400" size={16} />
        )}
        {activeCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-sm">
            {activeCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/50 dark:border-neutral-800/50">
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Tasks
              </span>
              {completedTasks.length > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-xs text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <FaTrash size={10} /> Clear completed
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar flex-1">
              {activeTasks.length === 0 && completedTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No active or recent tasks.
                </div>
              ) : (
                <div className="flex flex-col p-2 gap-2">
                  {activeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-neutral-50/50 dark:bg-neutral-800/30 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800/40 relative flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate pr-6">
                          {task.name}
                        </span>
                        {task.onCancel && (
                          <button
                            onClick={() => cancelTask(task.id)}
                            className="absolute right-2 top-2 p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Cancel task"
                          >
                            <FaStop size={8} />
                          </button>
                        )}
                      </div>
                      {task.process && (
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                          {task.process}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${task.progress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 min-w-7 text-right">
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                  ))}

                  {activeTasks.length > 0 && completedTasks.length > 0 && (
                    <div className="border-t border-neutral-150 dark:border-neutral-800/40 my-1" />
                  )}

                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-50/30 dark:hover:bg-neutral-800/10 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getStatusIcon(task.status)}
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                          {task.name}
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-400 uppercase tracking-wide shrink-0">
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskDropdown;
