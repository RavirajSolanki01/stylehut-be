export enum OrderStatus {
	PENDING,
	CONFIRMED,
	SHIPPED,
	OUT_FOR_DELIVERY,
	DELIVERED,
	CANCELLED,
	RETURNED,
	REFUNDED,
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