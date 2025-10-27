import bcrypt from 'bcrypt';
import { prisma } from '../../../config/db.js';
export async function fetchUsers(empresaId) {
    const where = {};
    if (empresaId) {
        where.client_id = empresaId;
    }
    return prisma.user.findMany({
        where,
        select: {
            id: true,
            user: true,
            name: true,
            status: true,
            updated: true,
            role: { select: { name: true } },
        },
        orderBy: { updated: 'desc' },
    });
}
export async function getUserById(id) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            role: { select: { id: true, name: true } },
            client: { select: { id: true, name: true } },
        },
    });
}
export async function updateUserById(id, payload) {
    const data = {};
    if (typeof payload.name !== 'undefined')
        data.name = payload.name;
    if (typeof payload.role_id !== 'undefined')
        data.role_id = payload.role_id;
    if (typeof payload.status !== 'undefined')
        data.status = payload.status;
    if (payload.password && payload.password.trim().length > 0) {
        const hash = await bcrypt.hash(payload.password, 10);
        data.pass = hash;
    }
    data.updated = new Date();
    return prisma.user.update({ where: { id }, data });
}
export async function deleteUserById(id) {
    return prisma.user.delete({ where: { id } });
}
