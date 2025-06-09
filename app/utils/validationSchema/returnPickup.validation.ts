import { z } from "zod";
import { PickupSlot, PickupStatus } from "@prisma/client";

export const schedulePickupSchema = z.object({
  returnRequestId: z.number().int().positive(),
  scheduledDate: z.string().datetime(),
  slot: z.nativeEnum(PickupSlot)
});

export const updatePickupStatusSchema = z.object({
  status: z.nativeEnum(PickupStatus),
  notes: z.string().optional(),
  agentDetails: z.object({
    name: z.string().min(2).max(50),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits")
  }).optional()
});

export type SchedulePickupInput = z.infer<typeof schedulePickupSchema>;
export type UpdatePickupInput = z.infer<typeof updatePickupStatusSchema>;