"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, OtpInput } from "@/lib/validations/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
  });

  const onVerifyOtp = async (data: OtpInput) => {
    if (!email) {
      setError("Email is missing. Please go back and try again.");
      return;
    }
    setError(null);
    try {
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: data.otp }),
      });

      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyResult.error || "Invalid OTP");
      }

      router.push(`/register/details?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all">
      <div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Verify your email
        </h2>
        {email && (
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            We've sent a 4-digit code to {email}
          </p>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onVerifyOtp)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
              Enter 4-digit code
            </label>
            <input
              id="otp"
              type="text"
              maxLength={4}
              {...register("otp")}
              className="mt-2 appearance-none relative block w-32 mx-auto text-center text-2xl tracking-widest px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors"
              placeholder="0000"
            />
            {errors.otp && (
              <p className="mt-1 text-sm text-red-600 text-center">{errors.otp.message}</p>
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
              "Verify Email"
            )}
          </button>
        </div>
        
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer"
          >
            Go back
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
