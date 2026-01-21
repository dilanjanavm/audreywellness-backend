export interface SendLkApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface SendSmsResponse {
  status: 'success' | 'error';
  data?: any;
  message?: string;
}

export interface SmsMessageResponse {
  status: 'success' | 'error';
  data?: any;
  message?: string;
}

export interface ContactGroupResponse {
  status: 'success' | 'error';
  data?: any;
  message?: string;
}

export interface ContactResponse {
  status: 'success' | 'error';
  data?: any;
  message?: string;
}

export interface ProfileResponse {
  status: 'success' | 'error';
  data?: {
    remaining_units?: number;
    used_units?: number;
    profile?: any;
  };
  message?: string;
}

export interface BalanceResponse {
  status: 'success' | 'error';
  data?: {
    balance?: number;
    unit?: string;
  };
  message?: string;
}
