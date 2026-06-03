import { Extinguisher, Paginated } from '@fire-system/shared-types';
import { AppError, buildPaginated } from '@fire-system/shared-utils';
import { z } from 'zod';
import { extinguisherRepository, ListFilters } from './extinguisher.repository';
import { createExtinguisherSchema, updateExtinguisherSchema } from './extinguisher.validation';

type CreateInput = z.infer<typeof createExtinguisherSchema>;
type UpdateInput = z.infer<typeof updateExtinguisherSchema>;

export const extinguisherService = {
  async create(input: CreateInput, userId: string): Promise<Extinguisher> {
    const existing = await extinguisherRepository.findBySerial(input.serialNumber);
    if (existing) {
      throw AppError.conflict('An extinguisher with this serial number already exists');
    }
    return extinguisherRepository.create({ ...input, createdBy: userId });
  },

  async list(
    filters: ListFilters,
    page: number,
    pageSize: number,
  ): Promise<Paginated<Extinguisher>> {
    const { items, total } = await extinguisherRepository.list(filters);
    return buildPaginated(items, total, page, pageSize);
  },

  async getById(id: string): Promise<Extinguisher> {
    const found = await extinguisherRepository.findById(id);
    if (!found) throw AppError.notFound('Extinguisher not found');
    return found;
  },

  async update(id: string, input: UpdateInput): Promise<Extinguisher> {
    if (input.serialNumber) {
      const existing = await extinguisherRepository.findBySerial(input.serialNumber);
      if (existing && existing.id !== id) {
        throw AppError.conflict('An extinguisher with this serial number already exists');
      }
    }
    const updated = await extinguisherRepository.update(id, input);
    if (!updated) throw AppError.notFound('Extinguisher not found');
    return updated;
  },

  async remove(id: string): Promise<void> {
    const removed = await extinguisherRepository.remove(id);
    if (!removed) throw AppError.notFound('Extinguisher not found');
  },
};
