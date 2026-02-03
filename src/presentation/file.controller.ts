import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'

export class FileController {
    private formatResponse(res: Response, data: any, message: string = 'Succès') {
        if (res.locals.isFromConnect) {
            // Format strict attendu par le service CONNECT
            return res.json({
                success: true,
                status: 'success',
                message: message,
                payload: data // CONNECT cherche ce champ 'payload'
            })
        } else {
            // Format API Direct
            return res.json({
                success: true,
                message: message,
                data: data
            })
        }
    }

    private sendFileOrContent(res: Response, filepath: string) {
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Fichier non trouvé' 
            })
        }

        // Si la requête vient de Connect, on doit lire le fichier et le renvoyer en JSON
        if (res.locals.isFromConnect) {
            const ext = path.extname(filepath).toLowerCase();
            let content;

            try {
                if (ext === '.json') {
                    // Pour JSON, on parse pour renvoyer un objet propre
                    const raw = fs.readFileSync(filepath, 'utf-8');
                    content = JSON.parse(raw);
                } else if (ext === '.xml' || ext === '.txt') {
                    // Pour XML/Texte, on renvoie la chaîne
                    content = fs.readFileSync(filepath, 'utf-8');
                } else {
                    // Pour PDF ou binaire, on renvoie en Base64 pour que ça passe dans le JSON
                    const raw = fs.readFileSync(filepath);
                    content = raw.toString('base64');
                }
                
                return this.formatResponse(res, content, "Fichier récupéré");
            } catch (error: any) {
                return res.status(500).json({
                    success: false,
                    message: `Erreur lecture fichier: ${error.message}`
                });
            }
        }

        // Si accès direct (hors Connect), on lance le téléchargement classique
        return res.download(filepath)
    }
    
    downloadInvoice = (req: Request, res: Response) => {
        const filename = String(req.params.filename)
        const filepath = path.join(process.cwd(), 'public', 'invoices', filename)
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Fichier non trouvé' 
            })
        }
        
        this.sendFileOrContent(res, filepath);
        // res.download(filepath)
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
        this.sendFileOrContent(res, filepath);
        // res.download(filepath)
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
        
        this.sendFileOrContent(res, filepath);
        // res.download(filepath)
    }
    
    listFiles = (req: Request, res: Response) => {
        const baseDir = path.join(process.cwd(), 'public')
        // const invoices = fs.existsSync(path.join(baseDir, 'invoices')) ? fs.readdirSync(path.join(baseDir, 'invoices')) : []
        // const sepa = fs.existsSync(path.join(baseDir, 'sepa')) ? fs.readdirSync(path.join(baseDir, 'sepa')) : []
        // const cb = fs.existsSync(path.join(baseDir, 'cb')) ? fs.readdirSync(path.join(baseDir, 'cb')) : []
        
        const safeRead = (dir: string) => {
          const p = path.join(baseDir, dir);
          return fs.existsSync(p) ? fs.readdirSync(p) : [];
        };

        const data = {
          invoices: safeRead("invoices"),
          sepa: safeRead("sepa"),
          cb: safeRead("cb"),
        };
        
        return this.formatResponse(res, data, "Liste des fichiers récupérée")
    }
}