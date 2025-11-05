import type { Request, Response } from 'express'
import { fetchClientCompanyProfile, updateClientCompanyProfile } from '../services/companyService.js'

/**
 * GET /client/company/profile
 * Obtiene el perfil de empresa del cliente vinculado al usuario autenticado
 */
export async function getCompanyProfile(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Cliente no identificado en el token'
      })
    }

    const profile = await fetchClientCompanyProfile(clientId)

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró información del cliente'
      })
    }

    res.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error('Error al obtener perfil de empresa:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil de empresa',
    })
  }
}

/**
 * PUT /client/company/profile
 * Actualiza el perfil de empresa del cliente vinculado al usuario autenticado
 */
export async function updateCompanyProfile(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Cliente no identificado en el token'
      })
    }

    const profileData = req.body

    if (!profileData.name || profileData.name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la empresa es requerido'
      })
    }

    const updatedProfile = await updateClientCompanyProfile(clientId, profileData)

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Perfil de empresa actualizado correctamente',
    })
  } catch (error) {
    console.error('Error al actualizar perfil de empresa:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el perfil de empresa',
    })
  }
}
