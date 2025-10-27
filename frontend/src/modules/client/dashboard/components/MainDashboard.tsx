import PageHeader from '@shared/components/common/PageHeader'
import React from 'react'
import ServiceExpirationCard from './ServiceExpirationCard'

export default function MainDashboard() {
  return (
    <div>
        <PageHeader
          title="Panel de Control"
          description="Resumen de la actividad reciente y el estado de su cuenta."
          />

          <ServiceExpirationCard/>
    </div>
  )
}
