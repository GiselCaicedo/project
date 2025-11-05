import type { Request, Response } from 'express'
import { fetchRoles } from '../../shared/services/role.service.js'
import { fetchUsers } from '../../shared/services/user.service.js'
import { fetchClientDashboardData } from '../services/dashboardService.js'

export async function listRoles(_req: Request, res: Response) {
  const roles = await fetchRoles()
  const filtered = roles.filter((r) => r.panel === 'client')
  return res.json(filtered)
}

export async function listUsers(req: Request, res: Response) {
  const empresaId = (req as any)?.user?.empresaid as string | undefined
  if (!empresaId) return res.status(400).json({ message: 'Falta empresa en el token' })
  const users = await fetchUsers(empresaId)
  return res.json(users)
}

export async function getDashboardSummary(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    console.log('Client ID from token:', req);
    if (!clientId) {
      return res.status(400).json({ message: 'Cliente no identificado en el token' })
    }

    const dashboardData = await fetchClientDashboardData(clientId)

    res.json({
      success: true,
      data: dashboardData,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching client dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del dashboard',
    })
  }
}

