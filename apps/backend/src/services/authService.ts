/**
 * Authentication Service
 * 
 * Handles user signup, login, and JWT token generation
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../utils/db';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../constants/config';
import type {
  IUser,
  IUserWithPassword,
  ISignupRequest,
  ILoginRequest,
  IAuthResponse,
  IJwtPayload,
} from '../types/auth';

const SALT_ROUNDS = 10;

class AuthService {
  async signup(request: ISignupRequest): Promise<IAuthResponse> {
    const { email, password, displayName } = request;

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    try {
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await pool.query(
        'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at, updated_at, last_login',
        [email, passwordHash, displayName || null]
      );

      const user: IUser = result.rows[0];
      const token = this.generateToken(user);

      console.log(`✅ User signed up: ${email}`);

      return {
        success: true,
        token,
        user,
      };
    } catch (error) {
      console.error('❌ Signup error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  async login(request: ILoginRequest): Promise<IAuthResponse> {
    const { email, password } = request;

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    try {
      const userWithPassword = await this.findUserByEmailWithPassword(email);
      if (!userWithPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      const passwordMatch = await bcrypt.compare(password, userWithPassword.password_hash);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid email or password' };
      }

      await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [
        userWithPassword.id,
      ]);

      const user: IUser = {
        id: userWithPassword.id,
        email: userWithPassword.email,
        display_name: userWithPassword.display_name,
        created_at: userWithPassword.created_at,
        updated_at: userWithPassword.updated_at,
        last_login: new Date(),
      };

      const token = this.generateToken(user);

      console.log(`✅ User logged in: ${email}`);

      return {
        success: true,
        token,
        user,
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    try {
      const result = await pool.query(
        'SELECT id, email, display_name, created_at, updated_at, last_login FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error finding user:', error);
      return null;
    }
  }

  async findUserByEmailWithPassword(email: string): Promise<IUserWithPassword | null> {
    try {
      const result = await pool.query(
        'SELECT id, email, password_hash, display_name, created_at, updated_at, last_login FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error finding user with password:', error);
      return null;
    }
  }

  async findUserById(userId: number): Promise<IUser | null> {
    try {
      const result = await pool.query(
        'SELECT id, email, display_name, created_at, updated_at, last_login FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error finding user by ID:', error);
      return null;
    }
  }

  generateToken(user: IUser): string {
    const payload: IJwtPayload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): IJwtPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;
      return decoded;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return null;
    }
  }
}

export const authService = new AuthService();

