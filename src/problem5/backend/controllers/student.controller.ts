import { Router, Request, Response } from 'express';
import { IStudentService } from '../services/student.service';

export function buildStudentRouter(service: IStudentService): Router {
    const router = Router();

    router.post('/', async (req: Request, res: Response) => {
        const student = await service.create(req.body);
        res.status(201).json(student);
    });

    router.get('/', async (req: Request, res: Response) => {
        const { name, age, email, active } = req.query;

        const filters: any = {};

        if (name) filters.name = String(name);
        if (age) filters.age = Number(age);
        if (email) filters.email = String(email);
        if (active !== undefined) {
            const activeValue = Number(active);
            if (activeValue === 0 || activeValue === 1) {
                filters.active = activeValue as 0 | 1;
            }
        }

        const students = await service.getWithFilters(filters);
        res.json(students);
    });

    router.get('/:id', async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const student = await service.getById(id);
        if (!student) return res.status(404).json({ error: 'Not found' });
        res.json(student);
    });

    router.put('/:id', async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const updated = await service.updateById(id, req.body);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    });

    router.delete('/:id', async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const deleted = await service.softDeleteById(id);
        if (!deleted) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    });

    return router;
}
