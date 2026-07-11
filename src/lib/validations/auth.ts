import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type EmailInput = z.infer<typeof emailSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerDetailsSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Full name must be at least 3 characters")
      .max(50, "Full name must be at most 50 characters"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(30, "Password must be at most 30 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterDetailsInput = z.infer<typeof registerDetailsSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Full name must be at least 3 characters")
      .max(50, "Full name must be at most 50 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(30, "Password must be at most 30 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(4, "OTP must be exactly 4 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

export type OtpInput = z.infer<typeof otpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters").max(30, "Password must be at most 30 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
