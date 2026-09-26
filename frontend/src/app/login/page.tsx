"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Eye, EyeOff, Lock } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { loginSchema, type LoginInput } from "@/lib/validations";

const DEMO = { identifier: "demo@sonarbangla.ai", password: "demo123" };

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema) as Resolver<LoginInput>,
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const user = await login(data.identifier, data.password);
      toast.success(`Welcome, ${user.name}!`);
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell
      title="Log In"
      subtitle="Sign in to your account to create and save posters."
      footer={
        <>
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-[#FFC107] hover:underline">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email or Mobile" required error={errors.identifier?.message}>
          <TextInput
            {...register("identifier")}
            type="text"
            autoComplete="username"
            invalid={Boolean(errors.identifier)}
            placeholder="you@example.com or 01XXXXXXXXX"
            leftIcon={<AtSign className="size-4" />}
            className="font-bangla"
          />
        </Field>

        <Field label="Password" required error={errors.password?.message}>
          <TextInput
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-white/55">
            <input
              type="checkbox"
              className="size-3.5 rounded border-white/20 bg-white/5 accent-[#FFC107]"
            />
            <span>Remember me</span>
          </label>
          <span className="cursor-pointer text-white/40 hover:text-[#FFC107]">
            Forgot password?
          </span>
        </div>

        <Button type="submit" variant="gold" size="lg" fullWidth loading={submitting}>
          <span>Log In</span>
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setValue("identifier", DEMO.identifier);
          setValue("password", DEMO.password);
        }}
        className="font-bangla mt-4 w-full rounded-2xl border border-dashed border-white/15 px-4 py-3 text-left text-xs text-white/45 transition-colors hover:border-[#FFC107]/40 hover:text-white/70"
      >
        Use the demo account — <span className="text-[#FFC107]">{DEMO.identifier}</span> /{" "}
        {DEMO.password}
      </button>
    </AuthShell>
  );
}
