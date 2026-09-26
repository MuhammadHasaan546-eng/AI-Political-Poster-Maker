"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Eye, EyeOff, Lock, User2 } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterInput>,
    defaultValues: {
      name: "",
      identifier: "",
      password: "",
      confirmPassword: "",
      role: "user",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const user = await registerUser({
        name: data.name,
        identifier: data.identifier,
        password: data.password,
      });
      toast.success(`Welcome, ${user.name}! Your account has been created.`);
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell
      title="Register"
      subtitle="Open a free account and create your first poster today."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#FFC107] hover:underline">
            Log In
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full Name" required error={errors.name?.message}>
          <TextInput
            {...register("name")}
            autoComplete="name"
            invalid={Boolean(errors.name)}
            placeholder="Your name"
            leftIcon={<User2 className="size-4" />}
            className="font-bangla"
          />
        </Field>

        <Field
          label="Email or Mobile"
          required
          error={errors.identifier?.message}
          hint="Either one is fine."
        >
          <TextInput
            {...register("identifier")}
            autoComplete="username"
            invalid={Boolean(errors.identifier)}
            placeholder="you@example.com or 01XXXXXXXXX"
            leftIcon={<AtSign className="size-4" />}
            className="font-bangla"
          />
        </Field>

        <Field
          label="Password"
          required
          error={errors.password?.message}
          hint="At least 6 characters."
        >
          <TextInput
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
            placeholder="••••••••"
            leftIcon={<Lock className="size-4" />}
            rightSlot={
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
                className="text-white/40 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />
        </Field>

        <Field label="Confirm Password" required error={errors.confirmPassword?.message}>
          <TextInput
            {...register("confirmPassword")}
            type="password"
            autoComplete="new-password"
            invalid={Boolean(errors.confirmPassword)}
            placeholder="••••••••"
            leftIcon={<Lock className="size-4" />}
          />
        </Field>

        <label className="flex items-start gap-2.5 text-xs text-white/55">
          <input
            type="checkbox"
            required
            className="mt-0.5 size-3.5 rounded border-white/20 bg-white/5 accent-[#FFC107]"
          />
          <span className="leading-relaxed">
            I agree to the Terms of Service and Privacy Policy.
          </span>
        </label>

        <Button type="submit" variant="gold" size="lg" fullWidth loading={submitting}>
          <span>Create Account</span>
        </Button>
      </form>
    </AuthShell>
  );
}
