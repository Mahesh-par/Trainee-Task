import { Plus, Trash2 } from "lucide-react";

import type { CourseDayInput } from "../types";

type CourseDayEditorProps = {
  value: CourseDayInput;
  onChange: (value: CourseDayInput) => void;
  onSubmit: () => void;
  onDelete?: () => void;
  isSaving: boolean;
  hasExistingContent: boolean;
};

export function CourseDayEditor({
  value,
  onChange,
  onSubmit,
  onDelete,
  isSaving,
  hasExistingContent
}: CourseDayEditorProps) {
  const updateField = <K extends keyof CourseDayInput>(field: K, fieldValue: CourseDayInput[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const updateResource = (index: number, field: "label" | "url", fieldValue: string) => {
    const resources = value.resources.map((resource, resourceIndex) =>
      resourceIndex === index ? { ...resource, [field]: fieldValue } : resource
    );

    updateField("resources", resources);
  };

  const addResource = () => {
    updateField("resources", [...value.resources, { label: "", url: "" }]);
  };

  const removeResource = (index: number) => {
    if (value.resources.length === 1) {
      updateField("resources", [{ label: "", url: "" }]);
      return;
    }

    updateField(
      "resources",
      value.resources.filter((_, resourceIndex) => resourceIndex !== index)
    );
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-bold text-gray-700">
          Day Number
          <input
            type="number"
            min={1}
            max={15}
            value={value.dayNumber}
            onChange={(event) => updateField("dayNumber", Number(event.target.value))}
            readOnly={hasExistingContent}
            className={`mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm ${
              hasExistingContent ? "bg-gray-100 text-gray-600" : ""
            }`}
            required
          />
        </label>

        <label className="block text-sm font-bold text-gray-700">
          Topic Title
          <input
            type="text"
            value={value.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="HTML Fundamentals"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </label>
      </div>

      <label className="block text-sm font-bold text-gray-700">
        Explanation
        <textarea
          value={value.explanation}
          onChange={(event) => updateField("explanation", event.target.value)}
          rows={5}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6"
          placeholder="Explain the concept, why it matters in Shopify, and how it affects UX..."
          required
        />
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">Learning Resources</p>
          <button
            type="button"
            onClick={addResource}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Link
          </button>
        </div>

        <div className="space-y-3">
          {value.resources.map((resource, index) => (
            <div key={`resource-${index}`} className="grid gap-3 rounded-md border border-gray-200 p-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={resource.label}
                onChange={(event) => updateResource(index, "label", event.target.value)}
                placeholder="Resource label"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="url"
                value={resource.url}
                onChange={(event) => updateResource(index, "url", event.target.value)}
                placeholder="https://"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeResource(index)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 px-3 text-red-700 hover:bg-red-50"
                title="Remove resource"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="block text-sm font-bold text-gray-700">
        How it applies in Shopify
        <textarea
          value={value.shopifyApplication}
          onChange={(event) => updateField("shopifyApplication", event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6"
          required
        />
      </label>

      <label className="block text-sm font-bold text-gray-700">
        Where to access in Shopify
        <textarea
          value={value.shopifyAccessPath}
          onChange={(event) => updateField("shopifyAccessPath", event.target.value)}
          rows={2}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6"
          required
        />
      </label>

      <label className="block text-sm font-bold text-gray-700">
        Daily Task
        <textarea
          value={value.dailyTask}
          onChange={(event) => updateField("dailyTask", event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6"
          required
        />
      </label>

      <label className="block text-sm font-bold text-gray-700">
        Developer Tips
        <textarea
          value={value.developerTips}
          onChange={(event) => updateField("developerTips", event.target.value)}
          rows={2}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6"
          required
        />
      </label>

      <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-700">
        <input
          type="checkbox"
          checked={value.isPublished}
          onChange={(event) => updateField("isPublished", event.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        Publish for all trainees
      </label>

      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Day Content"}
        </button>

        {hasExistingContent && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSaving}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Delete Day
          </button>
        )}
      </div>
    </form>
  );
}
