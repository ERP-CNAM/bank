import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'

export class FileController {
    downloadInvoice = (req: Request, res: Response) => {
        const filename = String(req.params.filename)
        const filepath = path.join(process.cwd(), 'public', 'invoices', filename)
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Fichier non trouvé' 
            })
        }
        
        res.download(filepath)
    }
    
    downloadSepa = (req: Request, res: Response) => {
        const filename = String(req.params.filename)
        const filepath = path.join(process.cwd(), 'public', 'sepa', filename)
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Fichier non trouvé' 
            })
        }
        
        res.download(filepath)
    }
    
    downloadCb = (req: Request, res: Response) => {
        const filename = String(req.params.filename)
        const filepath = path.join(process.cwd(), 'public', 'cb', filename)
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Fichier non trouvé' 
            })
        }
        
        res.download(filepath)
    }
    
    listFiles = (req: Request, res: Response) => {
        const baseDir = path.join(process.cwd(), 'public')
        const invoices = fs.existsSync(path.join(baseDir, 'invoices')) ? fs.readdirSync(path.join(baseDir, 'invoices')) : []
        const sepa = fs.existsSync(path.join(baseDir, 'sepa')) ? fs.readdirSync(path.join(baseDir, 'sepa')) : []
        const cb = fs.existsSync(path.join(baseDir, 'cb')) ? fs.readdirSync(path.join(baseDir, 'cb')) : []
        
        res.json({
            success: true,
            data: {
                invoices,
                sepa,
                cb
            }
        })
    }
}