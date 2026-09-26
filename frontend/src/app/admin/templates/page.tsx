"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DatabaseZap,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { PosterThumbnail } from "@/components/poster/PosterCanvas";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { Field, Select, TextInput } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/ToastProvider";
import {
  apiAdminCreateTemplate,
  apiAdminDefaultLayout,
  apiAdminDeleteTemplate,
  apiAdminListTemplates,
  apiAdminSeedTemplates,
  apiAdminUpdateTemplate,
} from "@/lib/api-client";
import {
  OCCASION_LABELS,
  OCCASION_TYPES,
  type LayoutConfig,
  type OccasionType,
  type PosterFormData,
  type Template,
} from "@/lib/types";

const PREVIEW_FORM: PosterFormData = {
  occasionType: "general",
  headline: "Sample Headline",
  name: "Sample Name",
  designation: "Member",
  organization: "Organization",
  unionThanaJela: "Dhaka",
  partyName: "",
  promoteBy: "",
};

interface TemplateDraft {
  name: string;
  occasionType: OccasionType;
  thumbnailUrl: string;
  isActive: boolean;
}

const EMPTY_DRAFT: TemplateDraft = {
  name: "",
  occasionType: "general",
  thumbnailUrl: "",
  isActive: true,
};

export default function AdminTemplatesPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await apiAdminListTemplates());
    } catch {
      toastError("Could not load the template list.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setCreateOpen(true);
  };

  const openEdit = (template: Template) => {
    setDraft({
      name: template.title,
      occasionType: template.occasionType,
      thumbnailUrl: template.thumbnailUrl,
      isActive: template.isActive,
    });
    setEditing(template);
  };

  const handleCreate = useCallback(async () => {
    setSaving(true);
    try {
      const layout: LayoutConfig = await apiAdminDefaultLayout();
      await apiAdminCreateTemplate({
        name: draft.name,
        occasionType: draft.occasionType,
        thumbnailUrl: draft.thumbnailUrl,
        isActive: draft.isActive,
        layoutConfig: layout,
      });
      toastSuccess("New template created.");
      setCreateOpen(false);
      await refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Could not create the template.");
    } finally {
      setSaving(false);
    }
  }, [draft, toastSuccess, toastError, refresh]);

  const handleUpdate = useCallback(async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiAdminUpdateTemplate(editing.id, {
        name: draft.name,
        occasionType: draft.occasionType,
        thumbnailUrl: draft.thumbnailUrl,
        isActive: draft.isActive,
      });
      toastSuccess("Template updated.");
      setEditing(null);
      await refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }, [editing, draft, toastSuccess, toastError, refresh]);

  const toggleActive = useCallback(
    async (template: Template) => {
      setBusyId(template.id);
      try {
        await apiAdminUpdateTemplate(template.id, { isActive: !template.isActive });
        setTemplates((current) =>
          current.map((item) =>
            item.id === template.id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
      } catch {
        toastError("Could not save the change.");
      } finally {
        setBusyId(null);
      }
    },
    [toastError],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiAdminDeleteTemplate(deleteTarget.id);
      toastSuccess("Template deactivated.");
      setDeleteTarget(null);
      await refresh();
    } catch {
      toastError("Could not delete the template.");
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, toastSuccess, toastError, refresh]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      const result = await apiAdminSeedTemplates();
      toastSuccess(`Seeded ${result.inserted} built-in templates.`);
      await refresh();
    } catch {
      toastError("Seeding failed.");
    } finally {
      setSeeding(false);
    }
  }, [toastSuccess, toastError, refresh]);

  const draftForm = (
    <div className="space-y-4">
      <Field label="Template Name" required>
        <TextInput
          value={draft.name}
          onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
          placeholder="e.g. Great Victory Day"
          className="font-bangla"
        />
      </Field>
      <Field label="Occasion" required>
        <Select
          value={draft.occasionType}
          onChange={(event) =>
            setDraft((d) => ({ ...d, occasionType: event.target.value as OccasionType }))
          }
          options={OCCASION_TYPES.map((occasion) => ({
            value: occasion,
            label: OCCASION_LABELS[occasion],
          }))}
        />
      </Field>
      <Field label="Thumbnail URL" hint="Optional — leave blank to use the auto preview.">
        <TextInput
          value={draft.thumbnailUrl}
          onChange={(event) => setDraft((d) => ({ ...d, thumbnailUrl: event.target.value }))}
          placeholder="https://…"
        />
      </Field>
      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <span className="text-sm font-semibold text-white/75">Active</span>
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(event) => setDraft((d) => ({ ...d, isActive: event.target.checked }))}
          className="size-4 rounded border-white/20 bg-white/5 accent-[#FFC107]"
        />
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">
          Template Manager ({templates.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
            leftIcon={<RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={seeding}
            onClick={() => void handleSeed()}
            leftIcon={<DatabaseZap className="size-4" />}
          >
            <span>Seed Built-ins</span>
          </Button>
          <Button variant="gold" size="sm" onClick={openCreate} leftIcon={<Plus className="size-4" />}>
            <span>New Template</span>
          </Button>
        </div>
      </div>

      {loading && templates.length === 0 ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-7 animate-spin text-[#FFC107]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-card grid place-items-center rounded-3xl px-6 py-16 text-center">
          <p className="text-sm text-white/50">No templates yet.</p>
          <p className="mt-1 text-xs text-white/35">
            Click “Seed Built-ins” to add the default templates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {templates.map((template) => (
            <article key={template.id} className="glass-card overflow-hidden rounded-2xl">
              <div className="relative aspect-[3/4] bg-[#0D1117]">
                <PosterThumbnail layout={template.layoutConfig} formData={PREVIEW_FORM} />
                <span className="absolute left-2 top-2">
                  <Badge tone={template.isActive ? "emerald" : "neutral"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </span>
              </div>
              <div className="space-y-2 p-3">
                <h3 className="font-bangla line-clamp-2 text-sm font-bold text-white">
                  {template.title}
                </h3>
                <p className="font-bangla text-[0.68rem] text-white/40">
                  {OCCASION_LABELS[template.occasionType]}
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    variant="subtle"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(template)}
                    leftIcon={<Pencil className="size-3.5" />}
                  >
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="subtle"
                    size="icon"
                    aria-label="Toggle active"
                    loading={busyId === template.id}
                    onClick={() => void toggleActive(template)}
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                  <Button
                    variant="subtle"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => setDeleteTarget(template)}
                  >
                    <Trash2 className="size-3.5 text-[#F42A41]" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Template"
        description="A new template will be created with the default layout."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              loading={saving}
              disabled={draft.name.trim().length < 2}
              onClick={() => void handleCreate()}
            >
              Create
            </Button>
          </div>
        }
      >
        {draftForm}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Template"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              loading={saving}
              disabled={draft.name.trim().length < 2}
              onClick={() => void handleUpdate()}
            >
              Save
            </Button>
          </div>
        }
      >
        {draftForm}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Deactivate this template?"
        description="The template will be soft-deleted (isActive=false) so existing posters keep working."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={saving}
              onClick={() => void handleDelete()}
              leftIcon={<Trash2 className="size-4" />}
            >
              Deactivate
            </Button>
          </div>
        }
      >
        {deleteTarget && (
          <p className="font-bangla text-sm text-white/60">{deleteTarget.title}</p>
        )}
      </Modal>
    </div>
  );
}
