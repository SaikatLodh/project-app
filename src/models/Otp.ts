import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    otp: {
      type: Number,
      required: true,
    },
    otpExpire: {
      type: Date,
      default: null,
      required: true,
    },
    isotpsend: {
      type: Boolean,
      default: false,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const OtpModel =
  (mongoose.models.Otp as any) || mongoose.model('Otp', otpSchema);
