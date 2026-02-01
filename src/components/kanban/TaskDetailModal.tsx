"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { Task, Message } from "@/lib/supabase";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<void>;
}

interface TaskWithDetails extends Task {
  assignees?: Array<{
    agent_id: string;
    mc_agents: { name: string; session_key: string } | null;
  }>;
  messages?: Array<Message & { mc_agents?: { name: string } | null }>;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddComment,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [taskDetails, setTaskDetails] = useState<TaskWithDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchTaskDetails = useCallback(async (taskId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTaskDetails({ ...data.task, assignees: data.assignees, messages: data.messages });
      }
    } catch (err) {
      console.error("Failed to fetch task details:", err);
    }
    setLoadingDetails(false);
  }, []);

  // Track previous task id to detect changes
  const taskId = task?.id;

  // Fetch task details when modal opens with a task
  useEffect(() => {
    if (taskId && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching data when modal opens
      fetchTaskDetails(taskId);
    }
  }, [taskId, isOpen, fetchTaskDetails]);

  // Reset local state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- cleanup on modal close
      setIsEditing(false);
      setNewComment("");
      setShowDeleteConfirm(false);
      setTaskDetails(null);
    }
  }, [isOpen]);

  // Initialize edit form when starting to edit
  const handleStartEdit = useCallback(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
      });
      setIsEditing(true);
    }
  }, [task]);

  async function handleSave() {
    if (!task) return;
    setLoading(true);
    try {
      await onUpdate(task.id, editedTask);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update task:", err);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!task) return;
    setLoading(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
    setLoading(false);
  }

  async function handleAddComment() {
    if (!task || !newComment.trim()) return;
    setLoading(true);
    try {
      await onAddComment(task.id, newComment);
      setNewComment("");
      fetchTaskDetails(task.id);
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
    setLoading(false);
  }

  if (!task) return null;

  const displayTask = taskDetails || task;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Task" : "Task Details"} size="lg">
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              label="Title"
              value={editedTask.title || ""}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              value={editedTask.description || ""}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={4}
              placeholder="Add a description..."
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Priority"
                value={editedTask.priority || "medium"}
                onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Task["priority"] })}
                options={[
                  { value: "low", label: "🟢 Low" },
                  { value: "medium", label: "🔵 Medium" },
                  { value: "high", label: "🟠 High" },
                  { value: "urgent", label: "🔴 Urgent" },
                ]}
              />
              <Select
                label="Status"
                value={editedTask.status || "inbox"}
                onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as Task["status"] })}
                options={[
                  { value: "inbox", label: "📥 Inbox" },
                  { value: "assigned", label: "👤 Assigned" },
                  { value: "in_progress", label: "🔄 In Progress" },
                  { value: "review", label: "👁️ Review" },
                  { value: "done", label: "✅ Done" },
                  { value: "blocked", label: "🚫 Blocked" },
                ]}
              />
            </div>
            <Input
              label="Due Date"
              type="date"
              value={editedTask.due_date?.split("T")[0] || ""}
              onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value || null })}
            />
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} loading={loading} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Task Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-2xl font-semibold pr-4">{displayTask.title}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                    ✏️ Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                    🗑️
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <PriorityBadge priority={displayTask.priority} />
                <StatusBadge status={displayTask.status} />
                {displayTask.due_date && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    new Date(displayTask.due_date) < new Date() ? "bg-red-900 text-red-300" : "bg-gray-700 text-gray-300"
                  }`}>
                    📅 {new Date(displayTask.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
              <p className="text-gray-300 whitespace-pre-wrap">
                {displayTask.description || (
                  <span className="text-gray-500 italic">No description provided</span>
                )}
              </p>
            </div>

            {/* Assignees */}
            {taskDetails?.assignees && taskDetails.assignees.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Assignees</h4>
                <div className="flex flex-wrap gap-2">
                  {taskDetails.assignees.map((a) => (
                    <span
                      key={a.agent_id}
                      className="px-3 py-1 bg-gray-800 rounded-full text-sm flex items-center gap-1"
                    >
                      👤 {a.mc_agents?.name || "Unknown"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="mb-6 text-sm text-gray-500 space-y-1">
              <p>Created: {new Date(displayTask.created_at).toLocaleString()}</p>
              <p>Updated: {new Date(displayTask.updated_at).toLocaleString()}</p>
              <p className="text-gray-600 font-mono text-xs">ID: {displayTask.id}</p>
            </div>

            {/* Quick Status Change */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Quick Status Change</h4>
              <div className="flex flex-wrap gap-2">
                {(["inbox", "in_progress", "review", "done", "blocked"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={displayTask.status === status ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => onUpdate(displayTask.id, { status })}
                    disabled={displayTask.status === status}
                  >
                    {status === "inbox" && "📥"}
                    {status === "in_progress" && "🔄"}
                    {status === "review" && "👁️"}
                    {status === "done" && "✅"}
                    {status === "blocked" && "🚫"}
                    {" " + status.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3">
                Comments {taskDetails?.messages && `(${taskDetails.messages.length})`}
              </h4>

              {loadingDetails ? (
                <p className="text-gray-500 text-sm">Loading comments...</p>
              ) : taskDetails?.messages && taskDetails.messages.length > 0 ? (
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {taskDetails.messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-800 rounded p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">
                          {msg.mc_agents?.name || "System"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{msg.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-4">No comments yet</p>
              )}

              {/* Add Comment */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()} loading={loading}>
                  Send
                </Button>
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-sm mb-3">Are you sure you want to delete this task? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleDelete} loading={loading}>
                    Delete Task
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
