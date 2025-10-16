// Type definitions for Google Pay Service

export interface GooglePayAvailabilityResponse {
  result: boolean;
}

export interface GooglePayPaymentData {
  dummy?: string;
  // In a real implementation, this would contain actual payment data
  [key: string]: any;
}

export interface GooglePayPaymentResult {
  success: boolean;
  paymentData?: GooglePayPaymentData;
  error?: any;
  amount: number;
  description: string;
}

export interface GooglePayServiceInterface {
  initialize(): Promise<void>;
  isAvailable(): Promise<GooglePayAvailabilityResponse>;
  processPayment(amount: number, description: string): Promise<GooglePayPaymentResult>;
}