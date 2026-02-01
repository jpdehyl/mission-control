"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Task } from "@/lib/supabase";
import { KanbanColumn, COLUMNS, ColumnId, getStatusForColumn } from "./KanbanColumn";
import { TaskCardOverlay } from "./TaskCard";
import { TaskDetailModal } from "./TaskDetailModal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<void>;
  onRefresh: () => void;
}

export function KanbanBoard({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onAddComment,
  onRefresh,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<Task["priority"] | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        filterPriority === "all" || task.priority === filterPriority;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, filterPriority]);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<ColumnId, Task[]> = {
      inbox: [],
      assigned: [],
      in_progress: [],
      review: [],
      blocked: [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      // Map task status to column
      const column = COLUMNS.find((col) => col.statuses.includes(task.status));
      if (column) {
        grouped[column.id].push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
    }
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Could be used for preview effects
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const task = active.data.current?.task as Task | undefined;
      if (!task) return;

      // Determine target column
      let targetColumnId: ColumnId | null = null;

      // Check if dropped on a column
      if (over.data.current?.columnId) {
        targetColumnId = over.data.current.columnId as ColumnId;
      } else {
        // Dropped on another task - find its column
        const overTask = tasks.find((t) => t.id === over.id);
        if (overTask) {
          const column = COLUMNS.find((col) => col.statuses.includes(overTask.status));
          if (column) {
            targetColumnId = column.id;
          }
        }
      }

      if (!targetColumnId) return;

      // Get new status for the column
      const newStatus = getStatusForColumn(targetColumnId);

      // Only update if status changed
      if (task.status !== newStatus) {
        try {
          await onTaskUpdate(task.id, { status: newStatus });
        } catch (err) {
          console.error("Failed to update task status:", err);
        }
      }
    },
    [tasks, onTaskUpdate]
  );

  // Task click handler
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  // Modal handlers
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
  }, []);

  const handleTaskUpdateFromModal = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      await onTaskUpdate(taskId, updates);
      // Update selected task with new data
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
      onRefresh();
    },
    [onTaskUpdate, onRefresh]
  );

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const urgent = tasks.filter((t) => t.priority === "urgent").length;
    const overdue = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
    ).length;

    return { total, done, blocked, urgent, overdue };
  }, [tasks]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Task["priority"] | "all")}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 mb-4 text-sm flex-wrap">
        <span className="text-gray-400">
          Total: <strong className="text-white">{stats.total}</strong>
        </span>
        <span className="text-green-400">
          Done: <strong>{stats.done}</strong>
        </span>
        {stats.blocked > 0 && (
          <span className="text-red-400">
            Blocked: <strong>{stats.blocked}</strong>
          </span>
        )}
        {stats.urgent > 0 && (
          <span className="text-red-400">
            Urgent: <strong>{stats.urgent}</strong>
          </span>
        )}
        {stats.overdue > 0 && (
          <span className="text-orange-400">
            Overdue: <strong>{stats.overdue}</strong>
          </span>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-1 overflow-x-auto">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              emoji={column.emoji}
              color={column.color}
              tasks={tasksByColumn[column.id]}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleTaskUpdateFromModal}
        onDelete={async (taskId) => {
          await onTaskDelete(taskId);
          handleModalClose();
          onRefresh();
        }}
        onAddComment={onAddComment}
      />
    </div>
  );
}
