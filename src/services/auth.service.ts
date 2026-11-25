import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { signAuthToken, UserRole } from '@/lib/auth';
import { User } from '@/models';

export interface RegisterCustomerInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface SafeUserProfile {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt?: Date;
}

function toSafeUser(doc: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt?: Date;
}): SafeUserProfile {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    phone: doc.phone,
    createdAt: doc.createdAt,
  };
}

export async function registerCustomer(data: RegisterCustomerInput) {
  await connectDB();

  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const password = data.password;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const created = await User.create({
    name,
    email,
    password: hashedPassword,
    phone: data.phone?.trim(),
    role: 'customer',
  });

  const user = toSafeUser(created);
  const token = await signAuthToken({
    userId: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return { user, token };
}

export async function loginUser(email: string, password: string) {
  await connectDB();

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const found = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!found) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, found.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = toSafeUser(found);
  const token = await signAuthToken({
    userId: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return { user, token };
}

export async function getUserProfile(userId: string) {
  await connectDB();

  const user = await User.findById(userId).select('-password').lean();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}