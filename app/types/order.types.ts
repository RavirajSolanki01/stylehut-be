export enum OrderStatus {
	PENDING,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    RETURN_REQUESTED,
    RETURN_APPROVED,
    RETURN_REJECTED,
    RETURN_PICKUP_SCHEDULED,
    RETURN_PICKED,
    RETURN_RECEIVED,
    REFUND_INITIATED,
    REFUND_COMPLETED
}

export enum ReturnRequest {
	PENDING,
	APPROVED,
	REJECTED,
	PICKUP_SCHEDULED,
	PICKED_UP,
	RECEIVED,
	QC_PASSED,
	QC_FAILED,
	REFUND_INITIATED,
	REFUND_COMPLETED,
}

export enum PaymentStatus {
	PENDING,
	PAID,
	FAILED,
	REFUNDED,
}

export enum PaymentMethod {
	CREDIT_CARD,
	DEBIT_CARD,
	UPI,
	NET_BANKING,
	WALLET,
	CASH_ON_DELIVERY,
}

export enum ReturnReason {
	WRONG_SIZE,
	DAMAGED_PRODUCT,
	DIFFERENT_PRODUCT,
	QUALITY_ISSUE,
	OTHER,
}

export type OrderStatusType = keyof typeof OrderStatus;
export type PaymentStatusType = keyof typeof PaymentStatus;
export type PaymentMethodType = keyof typeof PaymentMethod;
export type ReturnReasonType = keyof typeof ReturnReason;
export type ReturnRequestType = keyof typeof ReturnRequest;