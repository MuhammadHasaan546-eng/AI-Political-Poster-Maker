"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, IdCard, Megaphone, Sparkles, User2, Wand2 } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Field, TextInput } from "@/components/ui/Input";
import { posterFormSchema, type PosterFormValues } from "@/lib/validations";
import { OCCASION_LABELS, OCCASION_TYPES, type OccasionType } from "@/lib/types";
import { PRESET_HEADLINES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export interface BuilderFormProps {
  /** Initial/default values (used when `formKey` changes). */
  values: PosterFormValues;
  /**
   * Lifts every keystroke to the parent so the canvas preview stays live.
   * RHF remains the source of truth for validation.
   */
  onChange: (values: PosterFormValues) => void;
  /** Called with validated values when the user asks the AI to generate. */
  onGenerate?: (values: PosterFormValues) => void;
  /** Change this (e.g. template id) to reset the form with new defaults. */
  formKey?: string;
  className?: string;
}

function OccasionPicker({
  value,
  onChange,
}: {
  value: OccasionType;
  onChange: (next: OccasionType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OCCASION_TYPES.map((occasion) => (
        <Chip
          key={occasion}
          active={value === occasion}
          onClick={() => onChange(occasion)}
        >
          <span className="font-bangla">{OCCASION_LABELS[occasion]}</span>
        </Chip>
      ))}
    </div>
  );
}

/**
 * Left-hand data entry panel of the builder.
 * React Hook Form + Zod handle validation; every change is mirrored upward so
 * the canvas preview re-renders as the user types.
 */
export function BuilderForm({
  values,
  onChange,
  onGenerate,
  formKey,
  className,
}: BuilderFormProps) {
  const {
    register,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PosterFormValues>({
    resolver: zodResolver(posterFormSchema) as Resolver<PosterFormValues>,
    defaultValues: values,
    mode: "onBlur",
  });

  /* Reset only when the template (formKey) changes — never mid-typing. */
  useEffect(() => {
    reset(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey, reset]);

  const occasionType = watch("occasionType");
  const headline = watch("headline");

  /** Mirror a single field into the parent for live preview. */
  const mirror = (partial: Partial<PosterFormValues>) =>
    onChange({ ...getValues(), ...partial });

  const submit = handleSubmit((data) => {
    onChange(data);
    onGenerate?.(data);
  });

  return (
    <form onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/50">
          <Sparkles className="size-4 text-[#FFC107]" /> Occasion
        </h2>
        <OccasionPicker
          value={occasionType}
          onChange={(next) => {
            setValue("occasionType", next);
            mirror({ occasionType: next });
          }}
        />
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/50">
          <Wand2 className="size-4 text-[#FFC107]" /> Content
        </h2>

        <Field
          label="Headline"
          required
          error={errors.headline?.message}
          hint="Pick a preset or write your own."
        >
          <TextInput
            value={headline}
            invalid={Boolean(errors.headline)}
            placeholder="e.g. Great Victory Day"
            className="font-bangla"
            onChange={(event) => {
              setValue("headline", event.target.value);
              mirror({ headline: event.target.value });
            }}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESET_HEADLINES.slice(0, 6).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setValue("headline", preset);
                  mirror({ headline: preset });
                }}
                className={cn(
                  "font-bangla rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.72rem] transition-colors",
                  headline === preset
                    ? "border-[#FFC107]/50 text-[#FFC107]"
                    : "text-white/55 hover:border-white/25 hover:text-white",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Name" required error={errors.name?.message}>
          <TextInput
            {...register("name", {
              onChange: (event) => mirror({ name: event.target.value }),
            })}
            invalid={Boolean(errors.name)}
            placeholder="Full name"
            className="font-bangla"
            leftIcon={<User2 className="size-4" />}
          />
        </Field>

        <Field label="Designation" required error={errors.designation?.message}>
          <TextInput
            {...register("designation", {
              onChange: (event) => mirror({ designation: event.target.value }),
            })}
            invalid={Boolean(errors.designation)}
            placeholder="e.g. President / General Secretary"
            className="font-bangla"
            leftIcon={<IdCard className="size-4" />}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/50">
          <Building2 className="size-4 text-[#FFC107]" /> Organization
        </h2>

        <Field label="Party / Organization" error={errors.organization?.message}>
          <TextInput
            {...register("organization", {
              onChange: (event) => mirror({ organization: event.target.value }),
            })}
            placeholder="Organization name"
            className="font-bangla"
          />
        </Field>

        <Field label="Union / Thana / District" error={errors.unionThanaJela?.message}>
          <TextInput
            {...register("unionThanaJela", {
              onChange: (event) => mirror({ unionThanaJela: event.target.value }),
            })}
            placeholder="e.g. Savar, Dhaka"
            className="font-bangla"
          />
        </Field>

        <Field label="Party Name" error={errors.partyName?.message}>
          <TextInput
            {...register("partyName", {
              onChange: (event) => mirror({ partyName: event.target.value }),
            })}
            placeholder="Political party name"
            className="font-bangla"
          />
        </Field>

        <Field
          label="Promoted By"
          error={errors.promoteBy?.message}
          hint="Shown as a credit at the bottom of the poster."
        >
          <TextInput
            {...register("promoteBy", {
              onChange: (event) => mirror({ promoteBy: event.target.value }),
            })}
            placeholder="Promoted by — your name / outreach"
            className="font-bangla"
            leftIcon={<Megaphone className="size-4" />}
          />
        </Field>
      </section>
    </form>
  );
}
