import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import 'reflect-metadata';
import { AppDataSource } from './database/data-source';
import { StudentEntity } from './entities/student.entity';
import { StudentService, IStudentService } from './services/student.service';
import { StudentRepository } from './repositories/student.repository';
import { buildStudentRouter } from './controllers/student.controller';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(bodyParser.json());

AppDataSource.initialize().then(() => {
    const repo = new StudentRepository();
    const service: IStudentService = new StudentService(repo);
    const studentRouter = buildStudentRouter(service);
    app.use('/students', studentRouter);

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});
