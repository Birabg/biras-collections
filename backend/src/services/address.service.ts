import { prisma } from '../config/prisma';
import { NotFoundError } from '../utils/errors';
import { mapAddress } from '../utils/mappers';

/*
 * Address service.
 *
 * Ownership is enforced in the query itself — `where: { id, userId }` on every
 * read, update and delete. A customer who guesses another customer's address id
 * receives 404, not their data, so the endpoint cannot be used to probe for
 * valid ids either.
 */

export async function listAddresses(userId: string) {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return addresses.map(mapAddress);
}

export async function getAddress(userId: string, id: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } });

  if (!address) throw new NotFoundError('That address could not be found.');

  return mapAddress(address);
}

export async function createAddress(
  userId: string,
  data: {
    fullName: string;
    phone: string;
    region: string;
    city: string;
    subCity: string;
    kebele?: string | null;
    streetAddress: string;
    additionalInfo?: string | null;
    isDefault: boolean;
  },
) {
  return prisma.$transaction(async (tx) => {
    const existingCount = await tx.address.count({ where: { userId } });

    /*
     * The first address is always the default, whatever the client asked for.
     * Otherwise a customer could end up with no default at all.
     */
    const shouldBeDefault = data.isDefault || existingCount === 0;

    if (shouldBeDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await tx.address.create({
      data: {
        userId,
        fullName: data.fullName,
        phone: data.phone,
        region: data.region,
        city: data.city,
        subCity: data.subCity,
        kebele: data.kebele ?? null,
        streetAddress: data.streetAddress,
        additionalInfo: data.additionalInfo ?? null,
        isDefault: shouldBeDefault,
      },
    });

    return mapAddress(address);
  });
}

export async function updateAddress(
  userId: string,
  id: string,
  data: Partial<Parameters<typeof createAddress>[1]>,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id, userId } });

    if (!existing) throw new NotFoundError('That address could not be found.');

    if (data.isDefault === true) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await tx.address.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.region !== undefined && { region: data.region }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.subCity !== undefined && { subCity: data.subCity }),
        ...(data.kebele !== undefined && { kebele: data.kebele }),
        ...(data.streetAddress !== undefined && { streetAddress: data.streetAddress }),
        ...(data.additionalInfo !== undefined && { additionalInfo: data.additionalInfo }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });

    return mapAddress(address);
  });
}

export async function deleteAddress(userId: string, id: string) {
  const existing = await prisma.address.findFirst({ where: { id, userId } });

  if (!existing) throw new NotFoundError('That address could not be found.');

  return prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });

    // Promote a replacement default so the customer is never left with none.
    if (existing.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }

    return { deleted: true };
  });
}

export async function setDefaultAddress(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id, userId } });

    if (!existing) throw new NotFoundError('That address could not be found.');

    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    const address = await tx.address.update({ where: { id }, data: { isDefault: true } });

    return mapAddress(address);
  });
}