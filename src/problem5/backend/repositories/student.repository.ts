import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { StudentEntity } from '../entities/student.entity';

export interface StudentFilter {
    name?: string;
    age?: number;
    email?: string;
    active?: 0 | 1;
}

export interface IStudentRepository {
    findAllActive(): Promise<StudentEntity[]>;
    findWithFilters(filters: StudentFilter): Promise<StudentEntity[]>;
    findById(id: number): Promise<StudentEntity | null>;
    create(data: Partial<StudentEntity>): Promise<StudentEntity>;
    updateById(id: number, data: Partial<StudentEntity>): Promise<StudentEntity | null>;
    softDeleteById(id: number): Promise<boolean>;
}

export class StudentRepository implements IStudentRepository {
    private readonly repository: Repository<StudentEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(StudentEntity);
    }

    async findAllActive(): Promise<StudentEntity[]> {
        return this.repository.find({
            where: { active: true, deleted: false },
            order: { id: 'ASC' },
        });
    }

    async findWithFilters(filters: StudentFilter): Promise<StudentEntity[]> {
        const queryBuilder = this.repository.createQueryBuilder('student');

        // Always exclude deleted records
        queryBuilder.where('student.deleted = :deleted', { deleted: false });

        // Apply filters
        if (filters.name !== undefined) {
            queryBuilder.andWhere('student.name LIKE :name', {
                name: `%${filters.name}%`
            });
        }

        if (filters.age !== undefined) {
            queryBuilder.andWhere('student.age = :age', { age: filters.age });
        }

        if (filters.email !== undefined) {
            queryBuilder.andWhere('student.email LIKE :email', {
                email: `%${filters.email}%`
            });
        }

        if (filters.active !== undefined) {
            const isActive = filters.active === 1;
            queryBuilder.andWhere('student.active = :active', {
                active: isActive
            });
        }

        queryBuilder.orderBy('student.id', 'ASC');

        return queryBuilder.getMany();
    }

    async findById(id: number): Promise<StudentEntity | null> {
        return this.repository.findOne({ where: { id, deleted: false } });
    }

    async create(data: Partial<StudentEntity>): Promise<StudentEntity> {
        const student = this.repository.create(data);
        return this.repository.save(student);
    }

    async updateById(id: number, data: Partial<StudentEntity>): Promise<StudentEntity | null> {
        const result = await this.repository.update({ id, deleted: false }, data);
        if (result.affected === 0) return null;
        return this.findById(id);
    }

    async softDeleteById(id: number): Promise<boolean> {
        const result = await this.repository.update({ id }, { deleted: true, active: false });
        return (result.affected ?? 0) > 0;
    }
}
