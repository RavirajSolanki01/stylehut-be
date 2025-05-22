export enum OrderStatus {
	PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    RETURN_REQUESTED = "RETURN_REQUESTED",
    RETURN_APPROVED = "RETURN_APPROVED",
    RETURN_REJECTED = "RETURN_REJECTED",
    RETURN_PICKUP_SCHEDULED = "RETURN_PICKUP_SCHEDULED",
    RETURN_PICKED = "RETURN_PICKED",
    RETURN_RECEIVED = "RETURN_RECEIVED",
    REFUND_INITIATED = "REFUND_INITIATED",
    REFUND_COMPLETED = "REFUND_COMPLETED"
}

export enum ReturnRequest {
	PENDING = "PENDING",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED",
	PICKUP_SCHEDULED = "PICKUP_SCHEDULED",
	PICKED_UP = "PICKED_UP",
	RECEIVED = "RECEIVED",
	QC_PASSED = "QC_PASSED",
	QC_FAILED = "QC_FAILED",
	REFUND_INITIATED = "REFUND_INITIATED",
	REFUND_COMPLETED = "REFUND_COMPLETED",
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