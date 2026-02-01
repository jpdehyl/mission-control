"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/supabase";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  isDragging?: boolean;
}

const priorityColors = {
  low: "border-l-gray-600",
  medium: "border-l-blue-500",
  high: "border-l-orange-500",
  urgent: "border-l-red-500",
};

const priorityEmoji = {
  low: "🟢",
  medium: "🔵",
  high: "🟠",
  urgent: "🔴",
};

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const dragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        // Prevent click when dragging
        if (!dragging) {
          onClick(task);
        }
      }}
      className={`
        bg-gray-800 rounded-lg p-3 border-l-4 ${priorityColors[task.priority]}
        cursor-pointer select-none
        transition-all duration-200
        hover:bg-gray-750 hover:shadow-lg hover:shadow-black/20
        active:scale-[0.98]
        ${dragging ? "opacity-50 shadow-xl scale-105 ring-2 ring-blue-500" : ""}
        group
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(task);
        }
      }}
      aria-label={`Task: ${task.title}, Priority: ${task.priority}, Status: ${task.status}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm flex-shrink-0">{priorityEmoji[task.priority]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-blue-300 transition-colors">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.due_date && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  isOverdue
                    ? "bg-red-900/50 text-red-300"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                📅 {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            {task.status === "blocked" && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-300">
                🚫 Blocked
              </span>
            )}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Static version for overlay during drag
export function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div
      className={`
        bg-gray-800 rounded-lg p-3 border-l-4 ${priorityColors[task.priority]}
        shadow-2xl ring-2 ring-blue-500 scale-105
      `}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm flex-shrink-0">{priorityEmoji[task.priority]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight line-clamp-2 text-blue-300">
            {task.title}
          </p>
        </div>
      </div>
    </div>
  );
}
