-- Seed Admin User Only
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
  new_id uuid;
BEGIN
  -- 1. Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com') THEN
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone, phone_change, phone_change_token, email_change_token_current, email_change_confirm_status
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', 'admin@gmail.com', crypt('Test@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"admin"}', now(), now(), '', '', '', '', NULL, '', '', '', 0
    );
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_id::text, new_id, format('{"sub":"%s","email":"%s"}', new_id::text, 'admin@gmail.com')::jsonb, 'email', now(), now(), now());
  END IF;
END $$;
