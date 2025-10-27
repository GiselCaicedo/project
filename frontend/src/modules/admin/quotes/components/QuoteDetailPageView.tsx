'use client';

import type { QuoteActionType, QuoteDetail, SendQuoteEmailInput, UpdateQuoteInput } from './types';
import Breadcrumbs from '@shared/components/ui/Breadcrumbs';
import SidePanel from '@shared/components/common/SidePanel';
import {
  convertAdminQuoteToInvoiceApi,
  generateAdminQuotePdfApi,
  getAdminQuoteDetailApi,
  sendAdminQuoteEmailApi,
  updateAdminQuoteApi,
} from '@shared/services/conexion';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import QuoteDetailInspector from './QuoteDetailInspector';
import QuoteEditForm from './QuoteEditForm';
import PageHeader from '@app/shared/components/common/PageHeader';

type QuoteDetailPageViewProps = {
  initialQuote: QuoteDetail;
  locale: string;
  quoteId: string;
};

export default function QuoteDetailPageView({ initialQuote, locale, quoteId }: QuoteDetailPageViewProps) {
  const [quote, setQuote] = useState<QuoteDetail>(initialQuote);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<QuoteActionType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notify } = useAlerts();

  const refreshQuote = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const detail = await getAdminQuoteDetailApi(quoteId);
      if (detail) {
        setQuote(detail);
      }
    } catch (error) {
      console.error('Failed to refresh quote detail', error);
      const message = error instanceof Error ? error.message : 'No fue posible actualizar la información.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [quoteId]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel admin', href: `/${locale}/admin/dashboard` },
      { label: 'Cotizaciones', href: `/${locale}/admin/quotes` },
      { label: quote.reference },
    ],
    [locale],
  );



  const handleGeneratePdf = useCallback(async () => {
    setActionLoading('pdf');
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await generateAdminQuotePdfApi(quoteId);
      setQuote(prev => ({
        ...prev,
        updatedAt: result.generatedAt ?? prev.updatedAt,
        actions: prev.actions.map(action =>
          action.type === 'pdf' ? { ...action, url: result.url ?? action.url ?? null } : action,
        ),
      }));
      setSuccessMessage('PDF generado correctamente.');
    } catch (error) {
      console.error('Failed to generate quote PDF', error);
      const message = error instanceof Error ? error.message : 'No fue posible generar el PDF de la cotización.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setActionLoading(null);
    }
  }, [quoteId]);

  const handleSendEmail = useCallback(
    async (payload: SendQuoteEmailInput) => {
      setActionLoading('email');
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        const result = await sendAdminQuoteEmailApi(quoteId, payload);
        const recipients = result.recipients.join(', ');
        setSuccessMessage(`Cotización enviada correctamente a ${recipients}.`);
      } catch (error) {
        console.error('Failed to send quote email', error);
        const message = error instanceof Error ? error.message : 'No fue posible enviar la cotización por correo.';
        setErrorMessage(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setActionLoading(null);
      }
    },
    [quoteId],
  );

  const handleConvertToInvoice = useCallback(async () => {
    setActionLoading('invoice');
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await convertAdminQuoteToInvoiceApi(quoteId);
      if (result.alreadyConverted) {
        setSuccessMessage('La cotización ya estaba convertida en factura.');
      } else {
        setSuccessMessage('Factura generada correctamente a partir de la cotización.');
      }
      await refreshQuote();
    } catch (error) {
      console.error('Failed to convert quote to invoice', error);
      const message = error instanceof Error ? error.message : 'No fue posible convertir la cotización en factura.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setActionLoading(null);
    }
  }, [quoteId, refreshQuote]);

  const handleEditOpen = useCallback(() => {
    setIsEditOpen(true);
    setErrorMessage(null);
  }, []);

  const handleEditClose = useCallback(() => {
    setIsEditOpen(false);
  }, []);

  const handleEditSubmit = useCallback(
    async (payload: UpdateQuoteInput) => {
      setSavingEdit(true);
      setErrorMessage(null);
      try {
        const updated = await updateAdminQuoteApi(quoteId, payload);
        setQuote(updated);
        setSuccessMessage('Cotización actualizada correctamente.');
        notify({ type: 'success', title: 'Cotización actualizada correctamente.' });
        setIsEditOpen(false);
      } catch (error) {
        console.error('Failed to update quote', error);
        const message = error instanceof Error ? error.message : 'No fue posible actualizar la cotización.';
        setErrorMessage(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setSavingEdit(false);
      }
    },
    [notify, quoteId],
  );

  return (
    <div className="space-y-6" ref={containerRef}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Detalle Cotización"
        description="[Descripcion pendiente]"
      />

      <div>
        <QuoteDetailInspector
          quote={quote}
          loading={isLoading}
          locale={locale}
          onGeneratePdf={handleGeneratePdf}
          onSendEmail={handleSendEmail}
          onConvertToInvoice={handleConvertToInvoice}
          actionLoading={actionLoading}
          errorMessage={errorMessage}
          successMessage={successMessage}
          mode="page"
          onEdit={handleEditOpen}
        />
      </div>
      <SidePanel
        title="Editar cotización"
        open={isEditOpen}
        onClose={handleEditClose}
        reserveRef={containerRef}
      >
        {quote ? (
          <QuoteEditForm quote={quote} submitting={savingEdit} onSubmit={handleEditSubmit} onCancel={handleEditClose} />
        ) : (
          <p className="text-sm text-gray-500">No se encontró la cotización seleccionada.</p>
        )}
      </SidePanel>
    </div>
  );
}
