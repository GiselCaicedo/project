import { listUsers } from '../../../modules/client/controllers/clientController';
// Mock de servicio compartido de usuarios
jest.mock('../../../modules/shared/services/user.service', () => ({
    fetchUsers: jest.fn(async (_empresaId) => [{ id: 'u1', name: 'User 1' }]),
}));
describe('clientController', () => {
    test('listUsers usa empresaid del token para filtrar', async () => {
        const req = { user: { empresaid: 'c1' } };
        const json = jest.fn();
        const status = jest.fn(() => ({ json }));
        const res = { json, status };
        await listUsers(req, res);
        // Debe devolver el mock sin error de empresa
        expect(json).toHaveBeenCalledWith([{ id: 'u1', name: 'User 1' }]);
    });
    test('listUsers retorna 400 si falta empresaid', async () => {
        const req = { user: {} };
        const json = jest.fn();
        const res = { json, status: (code) => ({ json: (p) => json({ code, ...p }) }) };
        await listUsers(req, res);
        expect(json).toHaveBeenCalled();
        const payload = json.mock.calls[0][0];
        expect(payload.code).toBe(400);
    });
});
