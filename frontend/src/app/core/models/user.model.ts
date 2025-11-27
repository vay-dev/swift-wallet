export interface User {
  id: number;
  phone_number: string;
  account_number: string;
  full_name: string;
  email?: string;
  is_verified: boolean;
  profile_picture?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
  device_id: string;
  device_name?: string;
}

export interface SignupOTPRequest {
  phone_number: string;
}

export interface SignupVerifyRequest {
  phone_number: string;
  otp_code: string;
  password: string;
  full_name: string;
  email?: string;
  device_id: string;
  device_name?: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}
