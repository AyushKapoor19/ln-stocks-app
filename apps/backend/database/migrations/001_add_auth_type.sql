-- Migration: Add auth_type column to device_codes table
-- This allows the TV to specify whether the user should sign up or sign in

ALTER TABLE device_codes ADD COLUMN IF NOT EXISTS auth_type VARCHAR(10) DEFAULT 'signin';

-- Update existing rows to have default value
UPDATE device_codes SET auth_type = 'signin' WHERE auth_type IS NULL;

