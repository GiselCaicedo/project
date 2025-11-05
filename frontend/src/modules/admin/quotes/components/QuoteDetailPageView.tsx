'use client';

import type { QuoteActionType, QuoteDetail, SendQuoteEmailInput, UpdateQuoteInput } from './types';
import PageHeader from '@app/shared/components/common/PageHeader';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import SidePanel from '@shared/components/common/SidePanel';
import {
  convertAdminQuoteToInvoiceApi,
  generateAdminQuotePdfApi,
  getAdminQuoteDetailApi,
  sendAdminQuoteEmailApi,
  updateAdminQuoteApi,
  updateAdminQuoteServicesApi,
  getAdminServicesListApi,
} from '@shared/services/conexion';
import { Pencil } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import QuoteDetailInspector from './QuoteDetailInspector';
import QuoteEditForm from './QuoteEditForm';
import QuoteServicesEditor from './QuoteServicesEditor';

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
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [servicesCatalog, setServicesCatalog] = useState<import('@admin/services/types').ServiceRecord[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
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
      const message = error instanceof Error ? error.message : 'No fue posible actualizar la informaciÃ³n.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [quoteId]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel de Cliente', href: `/${locale}/admin/dashboard` },
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
      const message = error instanceof Error ? error.message : 'No fue posible generar el PDF de la cotizaciÃ³n.';
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
        setSuccessMessage(`CotizaciÃ³n enviada correctamente a ${recipients}.`);
      } catch (error) {
        console.error('Failed to send quote email', error);
        const message = error instanceof Error ? error.message : 'No fue posible enviar la cotizaciÃ³n por correo.';
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
        setSuccessMessage('La cotizaciÃ³n ya estaba convertida en factura.');
      } else {
        setSuccessMessage('Factura generada correctamente a partir de la cotizaciÃ³n.');
      }
      await refreshQuote();
    } catch (error) {
      console.error('Failed to convert quote to invoice', error);
      const message = error instanceof Error ? error.message : 'No fue posible convertir la cotizaciÃ³n en factura.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setActionLoading(null);
    }
  }, [quoteId, refreshQuote]);

  const pdfAction = useMemo(() => quote.actions.find(a => a.type === 'pdf') ?? null, [quote]);
  const invoiceAction = useMemo(() => quote.actions.find(a => a.type === 'invoice') ?? null, [quote]);

  const handleEditOpen = useCallback(() => {
    setIsEditOpen(true);
    setErrorMessage(null);
    if (servicesCatalog.length === 0 && !servicesLoading) {
      setServicesLoading(true);
      setServicesError(null);
      getAdminServicesListApi()
        .then(({ services }) => setServicesCatalog(services))
        .catch((err) => {
          console.error('Failed to load services catalog', err);
          const message = err instanceof Error ? err.message : 'No fue posible cargar los servicios';
          setServicesError(message);
        })
        .finally(() => setServicesLoading(false));
    }
  }, []);

  const handleEditClose = useCallback(() => {
    setIsEditOpen(false);
  }, []);

  const handleServicesOpen = useCallback(() => {
    setIsServicesOpen(true);
    setErrorMessage(null);
    if (servicesCatalog.length === 0 && !servicesLoading) {
      setServicesLoading(true);
      setServicesError(null);
      getAdminServicesListApi()
        .then(({ services }) => setServicesCatalog(services))
        .catch((err) => {
          console.error('Failed to load services catalog', err);
          const message = err instanceof Error ? err.message : 'No fue posible cargar los servicios';
          setServicesError(message);
        })
        .finally(() => setServicesLoading(false));
    }
  }, [servicesCatalog.length, servicesLoading]);

  const handleServicesClose = useCallback(() => {
    setIsServicesOpen(false);
  }, []);

  const handleEditSubmit = useCallback(
    async (payload: UpdateQuoteInput) => {
      setSavingEdit(true);
      setErrorMessage(null);
      try {
        const updated = await updateAdminQuoteApi(quoteId, payload);
        setQuote(updated);
        setSuccessMessage('CotizaciÃ³n actualizada correctamente.');
        notify({ type: 'success', title: 'CotizaciÃ³n actualizada correctamente.' });
        setIsEditOpen(false);
      } catch (error) {
        console.error('Failed to update quote', error);
        const message = error instanceof Error ? error.message : 'No fue posible actualizar la cotizaciÃ³n.';
        setErrorMessage(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setSavingEdit(false);
      }
    },
    [notify, quoteId],
  );

  const handleServicesSubmit = useCallback(
    async (services: import('@admin/quotes/types').QuoteServiceInput[]) => {
      setSavingServices(true);
      setErrorMessage(null);
      try {
        const updated = await updateAdminQuoteServicesApi(quoteId, services);
        setQuote(updated);
        setSuccessMessage('Servicios actualizados correctamente.');
        notify({ type: 'success', title: 'Servicios de cotizaciÃ³n actualizados.' });
      } catch (error) {
        console.error('Failed to update quote services', error);
        const message = error instanceof Error ? error.message : 'No fue posible actualizar los servicios.';
        setErrorMessage(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setSavingServices(false);
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
        actions={(
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={!pdfAction?.available || actionLoading === 'pdf'}
              className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
              title={pdfAction?.disabledReason ?? 'Generar PDF'}
            >
              {pdfAction?.label ?? 'Generar PDF'}
            </button>
            <button
              type="button"
              onClick={handleConvertToInvoice}
              disabled={!invoiceAction?.available || actionLoading === 'invoice'}
              className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
              title={invoiceAction?.disabledReason ?? 'Convertir a factura'}
            >
              {invoiceAction?.label ?? 'Factura'}
            </button>
            <button
            type="button"
            onClick={handleEditOpen}
            className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            <Pencil className="h-4 w-4" />
            Editar cotización
          </button>
          </div>
        )}
      />

      <div>
        <QuoteDetailInspector
          quote={quote}
          loading={isLoading}
          locale={locale}
          onGeneratePdf={handleGeneratePdf}
          onSendEmail={handleSendEmail}
          onConvertToInvoice={handleConvertToInvoice}
          onEditServices={handleServicesOpen}
          actionLoading={actionLoading}
          errorMessage={errorMessage}
          successMessage={successMessage}
          mode="page"
        />
      </div>
      <SidePanel
        title="Editar cotización"
        open={isEditOpen}
        onClose={handleEditClose}
        
      >
        {quote
          ? (
              <QuoteEditForm quote={quote} submitting={savingEdit} onSubmit={handleEditSubmit} onCancel={handleEditClose} />
            )
          : (
              <p className="text-sm text-gray-500">No se encontrÃ³ la cotizaciÃ³n seleccionada.</p>
            )}
      </SidePanel>
      <SidePanel
        title="Editar servicios de cotización"
        open={isServicesOpen}
        onClose={handleServicesClose}
        width={500}
      >
        <QuoteServicesEditor quote={quote} services={servicesCatalog} submitting={savingServices} onSubmit={handleServicesSubmit} />
      </SidePanel>
    </div>
  );
}


