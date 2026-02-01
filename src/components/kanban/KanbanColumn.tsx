"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task } from "@/lib/supabase";
import { TaskCard } from "./TaskCard";

export type ColumnId = "inbox" | "assigned" | "in_progress" | "review" | "done" | "blocked";

interface KanbanColumnProps {
  id: ColumnId;
  title: string;
  emoji: string;
  tasks: Task[];
  color: string;
  onTaskClick: (task: Task) => void;
  isOver?: boolean;
}

export function KanbanColumn({
  id,
  title,
  emoji,
  tasks,
  color,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { columnId: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-gray-900 rounded-lg border min-h-[300px] flex flex-col
        transition-all duration-200
        ${isOver
          ? "border-blue-500 ring-2 ring-blue-500/30 bg-blue-900/10"
          : "border-gray-800 hover:border-gray-700"
        }
      `}
    >
      {/* Column Header */}
      <div className={`px-3 py-2 border-b border-gray-800 sticky top-0 bg-gray-900 rounded-t-lg z-10`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-medium ${color} flex items-center gap-2`}>
            <span>{emoji}</span>
            <span>{title}</span>
          </h3>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-2 flex-1 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className={`
                text-center py-8 text-gray-600 text-sm
                ${isOver ? "bg-blue-500/10 rounded-lg border-2 border-dashed border-blue-500/30" : ""}
              `}>
                {isOver ? (
                  <span className="text-blue-400">Drop here</span>
                ) : (
                  <span>No tasks</span>
                )}
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// Column configuration
export const COLUMNS: Array<{
  id: ColumnId;
  title: string;
  emoji: string;
  color: string;
  statuses: Task["status"][];
}> = [
  {
    id: "inbox",
    title: "Inbox",
    emoji: "📥",
    color: "text-gray-400",
    statuses: ["inbox", "assigned"],
  },
  {
    id: "in_progress",
    title: "In Progress",
    emoji: "🔄",
    color: "text-yellow-400",
    statuses: ["in_progress"],
  },
  {
    id: "review",
    title: "Review",
    emoji: "👁️",
    color: "text-purple-400",
    statuses: ["review"],
  },
  {
    id: "blocked",
    title: "Blocked",
    emoji: "🚫",
    color: "text-red-400",
    statuses: ["blocked"],
  },
  {
    id: "done",
    title: "Done",
    emoji: "✅",
    color: "text-green-400",
    statuses: ["done"],
  },
];

// Helper to get target status for a column
export function getStatusForColumn(columnId: ColumnId): Task["status"] {
  const statusMap: Record<ColumnId, Task["status"]> = {
    inbox: "inbox",
    assigned: "assigned",
    in_progress: "in_progress",
    review: "review",
    done: "done",
    blocked: "blocked",
  };
  return statusMap[columnId];
}
