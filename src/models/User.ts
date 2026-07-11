import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [3, 'Full name must be at least 3 characters'],
      maxlength: [50, 'Full name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    profilePicture: {
      public_id: { type: String },
      url: { type: String },
    },
    googleAvatar: { type: String },
    isVerified: {
      type: Boolean,
      default: false,
    },
    forgotPasswordToken: {
      type: String,
      default: null,
    },
    forgotPasswordExpiry: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password as string, 12);
});


// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: '15m' }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: '7d' }
  );
};

// Generate forgot password token
userSchema.methods.getResetPasswordToken = function (): string {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.forgotPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
  return resetToken;
};

export const UserModel =
  (mongoose.models.User as any) || mongoose.model('User', userSchema);
