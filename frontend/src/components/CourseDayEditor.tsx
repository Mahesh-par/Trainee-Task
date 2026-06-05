import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { createResourcesSection, createTextSection } from "../lib/curriculumDefaults";
import type { CourseDayInput, CourseSection, CourseSectionType, CourseSectionVariant } from "../types";

type CourseDayEditorProps = {
  value: CourseDayInput;
  onChange: (value: CourseDayInput) => void;
  onSubmit: () => void;
  onDelete?: () => void;
  isSaving: boolean;
  hasExistingContent: boolean;
};

const variantOptions: Array<{ value: CourseSectionVariant; label: string }> = [
  { value: "default", label: "Default" },
  { value: "task", label: "Daily Task style" },
  { value: "tips", label: "Developer Tips style" },
  { value: "shopify", label: "Shopify note" },
  { value: "location", label: "Location note" }
];

export function CourseDayEditor({
  value,
  onChange,
  onSubmit,
  onDelete,
  isSaving,
  hasExistingContent
}: CourseDayEditorProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const orderedSections = [...value.sections].sort((left, right) => left.order - right.order);

  const updateSections = (sections: CourseSection[]) => {
    onChange({
      ...value,
      sections: sections.map((section, index) => ({ ...section, order: index }))
    });
  };

  const updateSection = (sectionId: string, patch: Partial<CourseSection>) => {
    updateSections(
      value.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      )
    );
  };

  const addSection = (type: CourseSectionType) => {
    const nextSection =
      type === "resources"
        ? createResourcesSection("New Resources", value.sections.length)
        : createTextSection("New Section", value.sections.length);

    updateSections([...value.sections, nextSection]);
  };

  const removeSection = (sectionId: string) => {
    if (value.sections.length === 1) {
      return;
    }

    updateSections(value.sections.filter((section) => section.id !== sectionId));
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      return;
    }

    const sections = [...orderedSections];
    const fromIndex = sections.findIndex((section) => section.id === draggingId);
    const toIndex = sections.findIndex((section) => section.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    updateSections(sections);
    setDraggingId(null);
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
            onChange={(event) => onChange({ ...value, dayNumber: Number(event.target.value) })}
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
            onChange={(event) => onChange({ ...value, title: event.target.value })}
            placeholder="HTML Fundamentals"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </label>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-extrabold text-gray-950">Content Sections</p>
            <p className="text-xs text-gray-500">
              Drag to reorder priority. Edit field names and content below.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addSection("text")}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Field
            </button>
            <button
              type="button"
              onClick={() => addSection("resources")}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Links
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orderedSections.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => setDraggingId(section.id)}
            onDragEnd={() => setDraggingId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(section.id)}
            className={`rounded-lg border bg-white p-4 transition ${
              draggingId === section.id
                ? "border-navy-700 opacity-60"
                : "border-gray-200 shadow-soft"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="cursor-grab rounded-md border border-gray-200 p-2 text-gray-500 active:cursor-grabbing"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                #{index + 1}
              </span>
              <input
                type="text"
                value={section.label}
                onChange={(event) => updateSection(section.id, { label: event.target.value })}
                placeholder="Field name"
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-bold"
                required
              />
              <select
                value={section.type}
                onChange={(event) => {
                  const type = event.target.value as CourseSectionType;

                  if (type === "resources") {
                    updateSection(section.id, {
                      type,
                      resources: section.resources ?? [{ label: "", url: "" }],
                      content: undefined
                    });
                    return;
                  }

                  updateSection(section.id, {
                    type,
                    content: section.content ?? "",
                    resources: undefined
                  });
                }}
                className="rounded-md border border-gray-300 px-2 py-2 text-xs font-semibold"
              >
                <option value="text">Text block</option>
                <option value="resources">Resource links</option>
              </select>
              <select
                value={section.variant ?? "default"}
                onChange={(event) =>
                  updateSection(section.id, {
                    variant: event.target.value as CourseSectionVariant
                  })
                }
                className="rounded-md border border-gray-300 px-2 py-2 text-xs font-semibold"
              >
                {variantOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeSection(section.id)}
                disabled={value.sections.length === 1}
                className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 px-3 text-red-700 hover:bg-red-50 disabled:opacity-40"
                title="Remove section"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {section.type === "text" ? (
              <textarea
                value={section.content ?? ""}
                onChange={(event) => updateSection(section.id, { content: event.target.value })}
                rows={4}
                placeholder="Section content..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6"
              />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      updateSection(section.id, {
                        resources: [...(section.resources ?? []), { label: "", url: "" }]
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Link
                  </button>
                </div>
                {(section.resources ?? []).map((resource, resourceIndex) => (
                  <div
                    key={`${section.id}-resource-${resourceIndex}`}
                    className="grid gap-3 rounded-md border border-gray-200 p-3 md:grid-cols-[1fr_1fr_auto]"
                  >
                    <input
                      type="text"
                      value={resource.label}
                      onChange={(event) => {
                        const resources = [...(section.resources ?? [])];
                        resources[resourceIndex] = {
                          ...resources[resourceIndex],
                          label: event.target.value
                        };
                        updateSection(section.id, { resources });
                      }}
                      placeholder="Resource label"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="url"
                      value={resource.url}
                      onChange={(event) => {
                        const resources = [...(section.resources ?? [])];
                        resources[resourceIndex] = {
                          ...resources[resourceIndex],
                          url: event.target.value
                        };
                        updateSection(section.id, { resources });
                      }}
                      placeholder="https://"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const resources = (section.resources ?? []).filter(
                          (_, index) => index !== resourceIndex
                        );
                        updateSection(section.id, {
                          resources: resources.length > 0 ? resources : [{ label: "", url: "" }]
                        });
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 px-3 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-700">
        <input
          type="checkbox"
          checked={value.isPublished}
          onChange={(event) => onChange({ ...value, isPublished: event.target.checked })}
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
