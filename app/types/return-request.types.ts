import { PaymentMethod } from './order.types';


export enum PaymentStatus {
	PENDING,
	PAID,
	FAILED,
	REFUNDED,
}

export interface ProcessReturnQCInput {
	status: boolean;
	notes: string;
}
  
export interface InitiateRefundInput {
	amount: number;
	paymentMethod: PaymentMethod;
	orderReference: string;
}
  
export interface RefundResponse {
	refundId: string;
	status: string;
	amount: number;
	timestamp: Date;
}

export enum PickupSlot {
  MORNING_9_12,
  AFTERNOON_12_3,
  EVENING_3_6
}

export enum PickupStatus {
  PENDING,
  SCHEDULED,
  RESCHEDULED,
  CANCELLED,
  ATTEMPTED,
  COMPLETED,
  FAILED
}