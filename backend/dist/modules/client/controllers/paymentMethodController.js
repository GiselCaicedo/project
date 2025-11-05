import { listPaymentMethods, fetchPaymentMethodById, } from '../services/paymentMethodService.js';
/**
 * GET /payment-methods
 * Lista todos los métodos de pago disponibles
 */
export async function listPaymentMethodsCtrl(_req, res) {
    try {
        const paymentMethods = await listPaymentMethods();
        return res.json({ success: true, data: { paymentMethods } });
    }
    catch (error) {
        console.error('listPaymentMethodsCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener los métodos de pago' });
    }
}
/**
 * GET /payment-methods/:id
 * Obtiene un método de pago específico por ID
 */
export async function getPaymentMethodByIdCtrl(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Falta el identificador del método de pago' });
        }
        const paymentMethod = await fetchPaymentMethodById(id);
        if (!paymentMethod) {
            return res.status(404).json({ success: false, message: 'Método de pago no encontrado' });
        }
        return res.json({ success: true, data: { paymentMethod } });
    }
    catch (error) {
        console.error('getPaymentMethodByIdCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener el método de pago' });
    }
}
