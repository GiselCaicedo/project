import { prisma } from '../../../config/db.js'

export type CompanyProfileData = {
  name: string
  legal_name?: string
  tax_id?: string
  phone?: string
  mobile?: string
  email?: string
  website?: string
  address?: string
  city?: string
  status: boolean
  admin_contact?: {
    name?: string
    role?: string
    phone?: string
    mobile?: string
    email?: string
  }
  accounting_contact?: {
    name?: string
    role?: string
    phone?: string
    mobile?: string
    email?: string
  }
}

/**
 * Obtiene el perfil de empresa del cliente vinculado al usuario
 */
export async function fetchClientCompanyProfile(clientId: string): Promise<CompanyProfileData | null> {
  try {
    // Buscar el cliente en la base de datos
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        client_details: {
          include: {
            client_parameter: true,
          },
        },
      },
    })

    if (!client) {
      return null
    }

    // Mapear los detalles del cliente a un objeto con claves
    const detailsMap: Record<string, string> = {}
    client.client_details.forEach((detail) => {
      if (detail.client_parameter?.name && detail.value) {
        detailsMap[detail.client_parameter.name] = detail.value
      }
    })

    // Construir el perfil de la empresa
    const profile: CompanyProfileData = {
      name: client.name || '',
      legal_name: detailsMap.legal_name || detailsMap.razon_social || '',
      tax_id: detailsMap.tax_id || detailsMap.nit || '',
      phone: detailsMap.phone || detailsMap.telefono || '',
      mobile: detailsMap.mobile || detailsMap.celular || '',
      email: detailsMap.email || detailsMap.correo || '',
      website: detailsMap.website || detailsMap.web || '',
      address: detailsMap.address || detailsMap.direccion || '',
      city: detailsMap.city || detailsMap.ciudad || '',
      status: client.status ?? true,
      admin_contact: {
        name: detailsMap.admin_contact_name || '',
        role: detailsMap.admin_contact_role || '',
        phone: detailsMap.admin_contact_phone || '',
        mobile: detailsMap.admin_contact_mobile || '',
        email: detailsMap.admin_contact_email || '',
      },
      accounting_contact: {
        name: detailsMap.accounting_contact_name || '',
        role: detailsMap.accounting_contact_role || '',
        phone: detailsMap.accounting_contact_phone || '',
        mobile: detailsMap.accounting_contact_mobile || '',
        email: detailsMap.accounting_contact_email || '',
      },
    }

    return profile
  } catch (error) {
    console.error('Error al obtener perfil de empresa del cliente:', error)
    throw error
  }
}

/**
 * Actualiza el perfil de empresa del cliente
 */
export async function updateClientCompanyProfile(
  clientId: string,
  profileData: CompanyProfileData
): Promise<CompanyProfileData> {
  try {
    // Actualizar datos básicos del cliente
    await prisma.client.update({
      where: { id: clientId },
      data: {
        name: profileData.name,
        status: profileData.status,
        updated: new Date(),
      },
    })

    // Obtener o crear parámetros para los detalles del cliente
    const parameterNames = [
      'legal_name',
      'tax_id',
      'phone',
      'mobile',
      'email',
      'website',
      'address',
      'city',
      'admin_contact_name',
      'admin_contact_role',
      'admin_contact_phone',
      'admin_contact_mobile',
      'admin_contact_email',
      'accounting_contact_name',
      'accounting_contact_role',
      'accounting_contact_phone',
      'accounting_contact_mobile',
      'accounting_contact_email',
    ]

    // Obtener todos los parámetros existentes
    const parameters = await prisma.client_parameter.findMany({
      where: {
        name: { in: parameterNames },
      },
    })

    // Crear parámetros que no existen
    const existingParamNames = new Set(parameters.map(p => p.name).filter(Boolean))
    const missingParams = parameterNames.filter(name => !existingParamNames.has(name))

    if (missingParams.length > 0) {
      await prisma.client_parameter.createMany({
        data: missingParams.map(name => ({
          id: crypto.randomUUID(),
          name,
        })),
      })

      // Volver a obtener todos los parámetros
      const updatedParameters = await prisma.client_parameter.findMany({
        where: {
          name: { in: parameterNames },
        },
      })
      parameters.push(...updatedParameters.filter(p => !existingParamNames.has(p.name || '')))
    }

    const parameterMap = new Map(parameters.map((p) => [p.name, p.id]))

    // Mapear los datos del perfil a detalles
    const detailsToUpdate: Array<{ paramName: string; value: string }> = [
      { paramName: 'legal_name', value: profileData.legal_name || '' },
      { paramName: 'tax_id', value: profileData.tax_id || '' },
      { paramName: 'phone', value: profileData.phone || '' },
      { paramName: 'mobile', value: profileData.mobile || '' },
      { paramName: 'email', value: profileData.email || '' },
      { paramName: 'website', value: profileData.website || '' },
      { paramName: 'address', value: profileData.address || '' },
      { paramName: 'city', value: profileData.city || '' },
      { paramName: 'admin_contact_name', value: profileData.admin_contact?.name || '' },
      { paramName: 'admin_contact_role', value: profileData.admin_contact?.role || '' },
      { paramName: 'admin_contact_phone', value: profileData.admin_contact?.phone || '' },
      { paramName: 'admin_contact_mobile', value: profileData.admin_contact?.mobile || '' },
      { paramName: 'admin_contact_email', value: profileData.admin_contact?.email || '' },
      { paramName: 'accounting_contact_name', value: profileData.accounting_contact?.name || '' },
      { paramName: 'accounting_contact_role', value: profileData.accounting_contact?.role || '' },
      { paramName: 'accounting_contact_phone', value: profileData.accounting_contact?.phone || '' },
      { paramName: 'accounting_contact_mobile', value: profileData.accounting_contact?.mobile || '' },
      { paramName: 'accounting_contact_email', value: profileData.accounting_contact?.email || '' },
    ]

    // Actualizar o crear cada detalle
    for (const detail of detailsToUpdate) {
      const parameterId = parameterMap.get(detail.paramName)
      if (!parameterId) continue

      // Buscar si ya existe un detalle para este parámetro
      const existingDetail = await prisma.client_details.findFirst({
        where: {
          client_id: clientId,
          c_parameter_id: parameterId,
        },
      })

      if (existingDetail) {
        // Actualizar el detalle existente
        await prisma.client_details.update({
          where: { id: existingDetail.id },
          data: { value: detail.value },
        })
      } else {
        // Crear un nuevo detalle
        await prisma.client_details.create({
          data: {
            id: crypto.randomUUID(),
            client_id: clientId,
            c_parameter_id: parameterId,
            value: detail.value,
          },
        })
      }
    }

    // Retornar el perfil actualizado
    return await fetchClientCompanyProfile(clientId) || profileData
  } catch (error) {
    console.error('Error al actualizar perfil de empresa del cliente:', error)
    throw error
  }
}
