export enum LoanStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  termInMonths: number;
  monthlyPayment: number;
  status: LoanStatus;
  requestDate: string;
  reviewDate?: string;
  adminComments?: string;
  userId: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export interface CreateLoanRequest {
  amount: number;
  interestRate: number;
  termInMonths: number;
}

export interface ReviewLoanRequest {
  status: LoanStatus;
  adminComments?: string;
}

export interface CalculatePaymentRequest {
  amount: number;
  interestRate: number;
  termInMonths: number;
}

export interface CalculatePaymentResponse {
  monthlyPayment: number;
}
