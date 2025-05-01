import cors, { CorsOptions } from 'cors'
import { Express } from 'express'

export const corsOptions: CorsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

export function configureCors(app: Express): void {
  app.use(cors(corsOptions))
}