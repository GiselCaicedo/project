'use client';

import type { PaymentMethodSummary } from '../types';
import PageHeader from '@app/shared/components/common/PageHeader';
import { createClientPaymentApi, getClientPaymentMethodsApi } from '@shared/services/conexion';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

type RechargeBalanceFormProps = {
  locale: string;
};

export function RechargeBalanceForm({ locale }: RechargeBalanceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    payment_method_id: '',
    value: '',
    code: '',
  });

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoadingMethods(true);
        const methods = await getClientPaymentMethodsApi();
        setPaymentMethods(methods);
      } catch (err: any) {
        console.error('Error loading payment methods:', err);
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchMethods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.payment_method_id || !formData.value) {
        throw new Error('Por favor complete todos los campos obligatorios');
      }

      const valueNumber = Number.parseFloat(formData.value);
      if (isNaN(valueNumber) || valueNumber <= 0) {
        throw new Error('El valor debe ser un número mayor a 0');
      }

      await createClientPaymentApi({
        payment_method_id: formData.payment_method_id,
        value: valueNumber.toString(),
        type: 'recarga',
        code: formData.code || null,
      });

      router.push(`/${locale}/client/payments`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la recarga');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Pagos', href: `/${locale}/client/payments` },
    { label: 'Recargar saldo' },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Recarga de Saldo"
        description="Complete el formulario para recargar su saldo"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6">
          {/* Valor a recargar */}
          <div>
            <label htmlFor="value" className="mb-2 block text-sm font-medium text-gray-700">
              Valor a Recargar
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">Ingrese el monto que desea recargar</p>
          </div>

          {/* Método de pago */}
          <div>
            <label htmlFor="payment_method_id" className="mb-2 block text-sm font-medium text-gray-700">
              Método de Pago
              {' '}
              <span className="text-red-500">*</span>
            </label>
            {loadingMethods
              ? (
                  <div className="text-sm text-gray-500">Cargando métodos de pago...</div>
                )
              : (
                  <select
                    id="payment_method_id"
                    name="payment_method_id"
                    value={formData.payment_method_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Seleccione un método de pago</option>
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                )}
          </div>

          {/* Código de referencia */}
          <div>
            <label htmlFor="code" className="mb-2 block text-sm font-medium text-gray-700">
              Código de Referencia (Opcional)
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ingrese un código de referencia si aplica"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading || loadingMethods}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? 'Procesando...' : 'Recargar Saldo'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
