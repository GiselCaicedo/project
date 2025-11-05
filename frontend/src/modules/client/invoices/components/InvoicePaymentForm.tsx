'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

type InvoicePaymentFormProps = {
  locale: string;
};

export default function InvoicePaymentForm({ locale }: InvoicePaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pse' | 'cash'>('card');

  const [formData, setFormData] = useState({
    // Información del cliente
    customerName: '',
    customerEmail: '',

    // Información del pago
    amount: '',
    description: '',

    // Tarjeta de crédito/débito
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardHolderName: '',

    // PSE (Sistema de pagos electrónicos)
    pseBankCode: '',
    pseDocumentType: 'CC',
    pseDocumentNumber: '',

    // Dirección de facturación (opcional)
    billingAddress: '',
    billingCity: '',
    billingCountry: 'CO',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones básicas
      if (!formData.customerName || !formData.customerEmail || !formData.amount) {
        throw new Error('Por favor complete todos los campos obligatorios');
      }

      if (paymentMethod === 'card') {
        if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvv || !formData.cardHolderName) {
          throw new Error('Por favor complete la información de la tarjeta');
        }
      }

      if (paymentMethod === 'pse') {
        if (!formData.pseBankCode || !formData.pseDocumentNumber) {
          throw new Error('Por favor complete la información de PSE');
        }
      }

      // Aquí iría la integración con la API de pago
      // await processPaymentApi(formData)

      console.log('Payment data:', { ...formData, paymentMethod });

      // Simulación de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));

      router.push(`/${locale}/client/invoices`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Información del Cliente */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Información del Cliente</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="customerName" className="mb-2 block text-sm font-medium text-gray-700">
              Nombre Completo
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              placeholder="Ej: Juan Pérez"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="mb-2 block text-sm font-medium text-gray-700">
              Correo Electrónico
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="customerEmail"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              required
              placeholder="ejemplo@correo.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Información del Pago */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Información del Pago</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="mb-2 block text-sm font-medium text-gray-700">
              Monto a Pagar
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Descripción del pago..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Método de Pago */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Método de Pago</h3>

        <div className="mb-6 flex gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
              paymentMethod === 'card'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            Tarjeta de Crédito/Débito
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('pse')}
            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
              paymentMethod === 'pse'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            PSE
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
              paymentMethod === 'cash'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            Efectivo
          </button>
        </div>

        {/* Formulario de Tarjeta */}
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="cardHolderName" className="mb-2 block text-sm font-medium text-gray-700">
                Nombre en la Tarjeta
                {' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cardHolderName"
                name="cardHolderName"
                value={formData.cardHolderName}
                onChange={handleChange}
                required={paymentMethod === 'card'}
                placeholder="Nombre como aparece en la tarjeta"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cardNumber" className="mb-2 block text-sm font-medium text-gray-700">
                Número de Tarjeta
                {' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleChange}
                required={paymentMethod === 'card'}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cardExpiry" className="mb-2 block text-sm font-medium text-gray-700">
                  Fecha de Vencimiento
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cardExpiry"
                  name="cardExpiry"
                  value={formData.cardExpiry}
                  onChange={handleChange}
                  required={paymentMethod === 'card'}
                  placeholder="MM/AA"
                  maxLength={5}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cardCvv" className="mb-2 block text-sm font-medium text-gray-700">
                  CVV
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cardCvv"
                  name="cardCvv"
                  value={formData.cardCvv}
                  onChange={handleChange}
                  required={paymentMethod === 'card'}
                  placeholder="123"
                  maxLength={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Formulario de PSE */}
        {paymentMethod === 'pse' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="pseBankCode" className="mb-2 block text-sm font-medium text-gray-700">
                Banco
                {' '}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="pseBankCode"
                name="pseBankCode"
                value={formData.pseBankCode}
                onChange={handleChange}
                required={paymentMethod === 'pse'}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Seleccione un banco</option>
                <option value="1007">Bancolombia</option>
                <option value="1013">BBVA Colombia</option>
                <option value="1032">Banco de Bogotá</option>
                <option value="1051">Davivienda</option>
                <option value="1052">Banco AV Villas</option>
                <option value="1062">Banco Falabella</option>
              </select>
            </div>

            <div>
              <label htmlFor="pseDocumentType" className="mb-2 block text-sm font-medium text-gray-700">
                Tipo de Documento
                {' '}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="pseDocumentType"
                name="pseDocumentType"
                value={formData.pseDocumentType}
                onChange={handleChange}
                required={paymentMethod === 'pse'}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="NIT">NIT</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PP">Pasaporte</option>
              </select>
            </div>

            <div>
              <label htmlFor="pseDocumentNumber" className="mb-2 block text-sm font-medium text-gray-700">
                Número de Documento
                {' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="pseDocumentNumber"
                name="pseDocumentNumber"
                value={formData.pseDocumentNumber}
                onChange={handleChange}
                required={paymentMethod === 'pse'}
                placeholder="Número de documento"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Información de Efectivo */}
        {paymentMethod === 'cash' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Al seleccionar pago en efectivo, recibirás un código de pago que podrás usar en puntos autorizados como Baloto, Efecty, etc.
            </p>
          </div>
        )}
      </div>

      {/* Dirección de Facturación (Opcional) */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Dirección de Facturación (Opcional)</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="billingAddress" className="mb-2 block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <input
              type="text"
              id="billingAddress"
              name="billingAddress"
              value={formData.billingAddress}
              onChange={handleChange}
              placeholder="Calle, número, apartamento"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="billingCity" className="mb-2 block text-sm font-medium text-gray-700">
                Ciudad
              </label>
              <input
                type="text"
                id="billingCity"
                name="billingCity"
                value={formData.billingCity}
                onChange={handleChange}
                placeholder="Ciudad"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="billingCountry" className="mb-2 block text-sm font-medium text-gray-700">
                País
              </label>
              <select
                id="billingCountry"
                name="billingCountry"
                value={formData.billingCountry}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="CO">Colombia</option>
                <option value="US">Estados Unidos</option>
                <option value="MX">México</option>
                <option value="ES">España</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? 'Procesando Pago...' : 'Procesar Pago'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      {/* Aviso de Seguridad */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs text-gray-600">
          🔒 Tu información está segura. Utilizamos encriptación de nivel bancario para proteger tus datos de pago.
        </p>
      </div>
    </form>
  );
}
