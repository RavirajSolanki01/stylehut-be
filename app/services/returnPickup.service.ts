import { PrismaClient } from '@prisma/client';
import { PickupSlot, PickupStatus } from '@prisma/client';
import { ReturnRequestStatus } from '@/app/types/order.types';

const prisma = new PrismaClient();

interface SchedulePickupInput {
  returnRequestId: number;
  scheduledDate: Date;
  slot: PickupSlot;
}

interface UpdatePickupInput {
  status: PickupStatus;
  notes?: string;
  agentDetails?: {
    name: string;
    phone: string;
  };
}

export const returnPickupService = {
  async schedulePickup(data: SchedulePickupInput) {
    return await prisma.$transaction(async (tx) => {
      // Create pickup record
      const pickup = await tx.return_pickup.create({
        data: {
          return_request_id: data.returnRequestId,
          scheduled_date: data.scheduledDate,
          slot: data.slot,
          status: PickupStatus.SCHEDULED
        }
      });

      // Update return request status
      await tx.return_request.update({
        where: { id: data.returnRequestId },
        data: {
          status: ReturnRequestStatus.PICKUP_SCHEDULED
        }
      });

      // Add to pickup history
      await tx.return_pickup_history.create({
        data: {
          return_request_id: data.returnRequestId,
          scheduled_date: data.scheduledDate,
          slot: data.slot,
          status: PickupStatus.SCHEDULED
        }
      });

      return pickup;
    });
  },

  async reschedulePickup(pickupId: number, data: SchedulePickupInput) {
    return await prisma.$transaction(async (tx) => {
      const currentPickup = await tx.return_pickup.findUnique({
        where: { id: pickupId }
      });

      if (!currentPickup) {
        throw new Error('Pickup not found');
      }

      // Update pickup record
      const pickup = await tx.return_pickup.update({
        where: { id: pickupId },
        data: {
          scheduled_date: data.scheduledDate,
          slot: data.slot,
          status: PickupStatus.RESCHEDULED,
          attempt_count: {
            increment: 1
          }
        }
      });

      // Add to pickup history
      await tx.return_pickup_history.create({
        data: {
          return_request_id: currentPickup.return_request_id,
          scheduled_date: data.scheduledDate,
          slot: data.slot,
          status: PickupStatus.RESCHEDULED
        }
      });

      return pickup;
    });
  },

  async updatePickupStatus(pickupId: number, data: UpdatePickupInput) {
    return await prisma.$transaction(async (tx) => {
      const pickup = await tx.return_pickup.update({
        where: { id: pickupId },
        data: {
          status: data.status,
          pickup_notes: data.notes,
          last_attempt: new Date(),
          ...(data.agentDetails && {
            pickup_agent: data.agentDetails.name,
            agent_phone: data.agentDetails.phone
          }),
          ...(data.status === PickupStatus.ATTEMPTED && {
            attempt_count: {
              increment: 1
            }
          })
        },
        include: {
          return_request: true
        }
      });

      // Update return request status if pickup is completed
      if (data.status === PickupStatus.COMPLETED) {
        await tx.return_request.update({
          where: { id: pickup.return_request_id },
          data: {
            status: ReturnRequestStatus.PICKUP_COMPLETED
          }
        });
      }

      // Add to pickup history
      await tx.return_pickup_history.create({
        data: {
          return_request_id: pickup.return_request_id,
          scheduled_date: pickup.scheduled_date,
          slot: pickup.slot,
          status: data.status,
          attempt_notes: data.notes
        }
      });

      return pickup;
    });
  }
};