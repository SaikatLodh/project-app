"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordInput } from "@/lib/validations/auth";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send reset link");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all">
      <div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email and we'll send you a reset link.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-6 rounded-md text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-sm">
              If an account exists for that email, we have sent a password reset link. Please check your inbox.
            </p>
            <div className="pt-4">
              <Link href="/login" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 cursor-pointer">
                Return to login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors"
                    placeholder="you@example.com"
                  />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">
                Back to login
              </Link>
            </div>
          </form>
        )}
    </div>
  );
}
