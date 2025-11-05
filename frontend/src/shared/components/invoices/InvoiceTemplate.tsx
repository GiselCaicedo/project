'use client';

import { Download } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice?: number | null;
  total: number;
};

export type InvoiceTemplateProps = {
  number?: string | null;
  clientName?: string | null;
  issuerName?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  currency?: string; // e.g. 'COP', 'USD'
  items: InvoiceItem[];
  subtotal?: number | null;
  tax1?: number | null;
  tax2?: number | null;
  vatAmount?: number | null; // IVA total (optional)
  total: number;
  onDownloadPdf?: () => Promise<void> | void; // Optional handler
};

const formatCurrency = (value: number | null | undefined, currency: string = 'COP') => {
  if (value == null || !Number.isFinite(value)) {
    return '-';
  }
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return String(value);
  }
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) {
    return '-';
  }
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function InvoiceTemplate({
  number,
  clientName,
  issuerName = '',
  issueDate,
  dueDate,
  currency = 'COP',
  items,
  subtotal,
  tax1,
  tax2,
  vatAmount,
  total,
  onDownloadPdf,
}: InvoiceTemplateProps) {
  const handlePrint = () => window.print();

  return (
    <section className="mx-auto rounded-xl">
      {/* Action buttons - only visible on screen */}
      <div className="flex items-center justify-end gap-2 border-b border-gray-100 px-6 py-3 print:hidden">
        {onDownloadPdf
          ? (
              <button
                type="button"
                onClick={() => void onDownloadPdf()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                {' '}
                Descargar PDF
              </button>
            )
          : null}

      </div>

      {/* Invoice content */}
      <div className="p-8">
        {/* Header with green accent line */}
        <div className="border-t-4 border-emerald-500 pb-6">
          {/* Logo and INVOICE header */}
          <div className="flex items-start justify-between pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500">
              <Image
                src="/favicon-16x16.png"
                alt="CIFRA PAY"
                width={32}
                height={32}
                priority
              />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">FACTURA</h1>
              <p className="mt-1 text-sm text-gray-500">{number ?? 'Sin número'}</p>
              <p className="text-xs text-gray-500">{issuerName || 'thiscompany@gmail.com'}</p>
              <p className="text-xs text-gray-500">Bogotá, Cundinamarca, Colombia</p>
            </div>
          </div>

          {/* Client info and dates */}
          <div className="mt-8 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Cliente</p>
              <p className="mt-1 text-base font-medium text-gray-900">{clientName ?? 'Página'}</p>
              <p className="text-sm text-gray-600">Colombia</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-xs text-gray-500">
                  Invoice -
                  {number ?? '9874'}
                </p>
                <p className="text-xs text-gray-500">{formatDate(issueDate)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-2">
                <p className="text-sm font-semibold text-gray-900">
                  Total
                  {formatCurrency(total, currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="mt-8">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="pb-3 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase">
                  Descripción Servicio
                </th>
                <th className="pb-3 text-right text-xs font-semibold tracking-wide text-gray-600 uppercase">Qty</th>
                <th className="pb-3 text-right text-xs font-semibold tracking-wide text-gray-600 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0
                ? (
                    items.map((it, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3 text-gray-700">{it.description}</td>
                        <td className="py-3 text-right text-gray-700">{it.quantity}</td>
                        <td className="py-3 text-right text-gray-700">{formatCurrency(it.total, currency)}</td>
                      </tr>
                    ))
                  )
                : (
                    <tr>
                      <td className="py-4 text-center text-gray-500" colSpan={3}>
                        Sin ítems.
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        {/* Totals section */}
        <div className="mt-8 flex justify-end">
          <div className="w-80">
            <div className="space-y-2 border-t border-gray-200 pt-4">
              {typeof subtotal === 'number'
                ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">SUB TOTAL</span>
                      <span className="text-gray-900">{formatCurrency(subtotal, currency)}</span>
                    </div>
                  )
                : null}
              {typeof vatAmount === 'number'
                ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">TAX</span>
                      <span className="text-gray-900">{formatCurrency(vatAmount, currency)}</span>
                    </div>
                  )
                : null}
              <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-bold">
                <span className="text-gray-900">VALOR TOTAL</span>
                <span className="text-gray-900">{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6 text-xs text-gray-500">
          <span>thiscompany@gmail.com</span>
          <span>+57 123 4567 0123</span>
          <span>www.company.com</span>
        </div>
      </div>

      {/* Bottom green accent line */}
      <div className="h-1 bg-emerald-500"></div>
    </section>
  );
}
