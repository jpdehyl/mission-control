"use client";

interface ToolToggleProps {
  name: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function ToolToggle({ name, enabled, onChange, disabled }: ToolToggleProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-900 rounded">
      <span className="text-sm text-gray-300">{name}</span>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`
          w-10 h-5 rounded-full relative transition-colors
          ${enabled ? "bg-blue-600" : "bg-gray-700"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span
          className={`
            absolute top-1 w-3 h-3 rounded-full bg-white transition-transform
            ${enabled ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}
