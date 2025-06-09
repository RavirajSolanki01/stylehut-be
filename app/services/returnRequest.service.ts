import { PrismaClient } from '@prisma/client';
import { ReturnRequestStatus, OrderStatus } from '@/app/types/order.types';

const prisma = new PrismaClient();

interface UpdateReturnStatusInput {
  status: ReturnRequestStatus;
  comment?: string;
  notes?: string;
  refund_id?: string;
  condition?: string;
}

const RETURN_STATUS_TRANSITIONS: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
    [ReturnRequestStatus.PENDING]: [ReturnRequestStatus.APPROVED, ReturnRequestStatus.REJECTED],
    [ReturnRequestStatus.APPROVED]: [ReturnRequestStatus.PICKUP_SCHEDULED],
    [ReturnRequestStatus.REJECTED]: [],
  
    // Pickup related transitions
    [ReturnRequestStatus.PICKUP_SCHEDULED]: [ReturnRequestStatus.PICKUP_ATTEMPTED, ReturnRequestStatus.PICKUP_CANCELLED, ReturnRequestStatus.PICKUP_COMPLETED, ReturnRequestStatus.PICKUP_FAILED],
    [ReturnRequestStatus.PICKUP_RESCHEDULED]: [ReturnRequestStatus.PICKUP_ATTEMPTED, ReturnRequestStatus.PICKUP_COMPLETED, ReturnRequestStatus.PICKUP_FAILED],
    [ReturnRequestStatus.PICKUP_CANCELLED]: [ReturnRequestStatus.PICKUP_RESCHEDULED],
    [ReturnRequestStatus.PICKUP_ATTEMPTED]: [ReturnRequestStatus.PICKUP_RESCHEDULED, ReturnRequestStatus.PICKUP_COMPLETED],
    [ReturnRequestStatus.PICKUP_COMPLETED]: [ReturnRequestStatus.RECEIVED],
    [ReturnRequestStatus.PICKUP_FAILED]: [ReturnRequestStatus.PICKUP_RESCHEDULED],
  
    // QC related transitions
    [ReturnRequestStatus.RECEIVED]: [ReturnRequestStatus.QC_PENDING],
    [ReturnRequestStatus.QC_PENDING]: [ReturnRequestStatus.QC_PASSED, ReturnRequestStatus.QC_FAILED],
    [ReturnRequestStatus.QC_PASSED]: [ReturnRequestStatus.REFUND_INITIATED],
    [ReturnRequestStatus.QC_FAILED]: [],
  
    // Refund related transitions
    [ReturnRequestStatus.REFUND_INITIATED]: [ReturnRequestStatus.REFUND_COMPLETED, ReturnRequestStatus.REFUND_FAILED],
    [ReturnRequestStatus.REFUND_COMPLETED]: [],
    [ReturnRequestStatus.REFUND_FAILED]: [ReturnRequestStatus.REFUND_INITIATED]
  };
  
const ORDER_STATUS_MAPPING: Partial<Record<ReturnRequestStatus, OrderStatus>> = {
    [ReturnRequestStatus.PENDING]: OrderStatus.RETURN_REQUESTED,
    [ReturnRequestStatus.APPROVED]: OrderStatus.RETURN_APPROVED,
    [ReturnRequestStatus.REJECTED]: OrderStatus.RETURN_REJECTED,
    [ReturnRequestStatus.PICKUP_SCHEDULED]: OrderStatus.RETURN_PICKUP_SCHEDULED,
    [ReturnRequestStatus.PICKUP_COMPLETED]: OrderStatus.RETURN_PICKED,
    [ReturnRequestStatus.RECEIVED]: OrderStatus.RETURN_RECEIVED,
    [ReturnRequestStatus.REFUND_INITIATED]: OrderStatus.REFUND_INITIATED,
    [ReturnRequestStatus.REFUND_COMPLETED]: OrderStatus.REFUND_COMPLETED
  };

export const returnRequestService = {
  async updateReturnStatus(returnRequestId: number, data: UpdateReturnStatusInput) {
    return await prisma.$transaction(async (tx) => {
      const returnRequest = await tx.return_request.findUnique({
        where: { id: returnRequestId },
        include: { order: true }
      });

      if (!returnRequest) {
        throw new Error('Return request not found');
      }

      // Validate status transition
      if (!RETURN_STATUS_TRANSITIONS[returnRequest.status as ReturnRequestStatus].includes(data.status)) {
        throw new Error(
          `Cannot transition from ${returnRequest.status} to ${data.status}`
        );
      }

      // Update return request
      const updateData: any = {
        status: data.status
      };

      // Add conditional fields based on status
      if (data.notes) updateData.qc_notes = data.notes;
      if (data.refund_id) updateData.refund_id = data.refund_id;
      if (data.condition) updateData.received_condition = data.condition;
      if (data.status === ReturnRequestStatus.REFUND_COMPLETED) {
        updateData.refunded_at = new Date();
      }

      const updatedReturn = await tx.return_request.update({
        where: { id: returnRequestId },
        data: updateData,
        include: { order: true }
      });

      // Update order status if needed
      const correspondingOrderStatus = ORDER_STATUS_MAPPING[data.status];
      if (correspondingOrderStatus) {
        await tx.orders.update({
          where: { id: returnRequest.order_id },
          data: {
            order_status: correspondingOrderStatus,
            timeline: {
              create: {
                status: correspondingOrderStatus,
                comment: data.comment || `Return status updated to ${data.status}`
              }
            }
          }
        });
      }

      return updatedReturn;
    });
  }
};