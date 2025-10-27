import { fetchRoles } from '../../shared/services/role.service.js';
import { fetchUsers } from '../../shared/services/user.service.js';
export async function listRoles(_req, res) {
    const roles = await fetchRoles();
    const filtered = roles.filter((r) => r.panel === 'client');
    return res.json(filtered);
}
export async function listUsers(req, res) {
    const empresaId = req?.user?.empresaid;
    if (!empresaId)
        return res.status(400).json({ message: 'Falta empresa en el token' });
    const users = await fetchUsers(empresaId);
    return res.json(users);
}
export function getDashboardSummary(_req, res) {
    res.json({
        success: true,
        data: {
            message: 'Panel de cliente UP!',
            fetchedAt: new Date().toISOString(),
            notices: [
                {
                    id: 'services',
                    title: 'Title Card',
                    description: 'ESTA ES UNA PRUEBA, PANEL CLIENTE OK.',
                },
            ],
        },
    });
}
