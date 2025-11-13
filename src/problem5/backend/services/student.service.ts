import { IStudentRepository, StudentFilter } from '../repositories/student.repository';

export interface IStudentService {
    getAllActive(): Promise<any[]>;
    getWithFilters(filters: StudentFilter): Promise<any[]>;
    getById(id: number): Promise<any | null>;
    create(data: Partial<any>): Promise<any>;
    updateById(id: number, data: Partial<any>): Promise<any | null>;
    softDeleteById(id: number): Promise<boolean>;
}

export class StudentService implements IStudentService {
    private readonly repo: IStudentRepository;

    constructor(repo: IStudentRepository) {
        this.repo = repo;
    }

    async getAllActive() {
        return this.repo.findAllActive();
    }

    async getWithFilters(filters: StudentFilter) {
        return this.repo.findWithFilters(filters);
    }

    async getById(id: number) {
        return this.repo.findById(id);
    }

    async create(data: Partial<any>) {
        return this.repo.create(data);
    }

    async updateById(id: number, data: Partial<any>) {
        return this.repo.updateById(id, data);
    }

    async softDeleteById(id: number) {
        return this.repo.softDeleteById(id);
    }
}
