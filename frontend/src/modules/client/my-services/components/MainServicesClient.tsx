'use client';

import PageHeader from '@shared/components/common/PageHeader'
import React from 'react'
import ServicesClientList from './ServicesClientList'
import type { ClientServiceSummary } from '@app/modules/client/services/types'

export default function MainServicesClient({ services, errorMessage }: { services: ClientServiceSummary[]; errorMessage: string | null }) {
  return (
    <div>
      <PageHeader
        title="Mis Servicios"
        description="Gestiona y administra tus servicios contratados con facilidad."
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      <ServicesClientList services={services} />
    </div>
  )
}
