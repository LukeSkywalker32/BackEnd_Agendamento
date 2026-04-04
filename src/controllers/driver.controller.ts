import type { NextFunction, Request, Response } from 'express'
import * as checkinService from '../services/checkin.service'

export async function getSchedulingsByCpf(req: Request, res: Response, next: NextFunction) {
  try {
    const schedulings = await checkinService.getSchedulingsByCpf(req.params.cpf as string)
    res.json({ status: 'success', data: schedulings })
  } catch (error) {
    next(error)
  }
}

export async function performCheckin(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await checkinService.performCheckin(req.body.cpf)
    res.status(201).json({ status: 'success', data: result })
  } catch (error) {
    next(error)
  }
}
