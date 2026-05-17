/// <reference types="vite/client" />

interface Window {
  db: {
    students: {
      create(data: any): Promise<any>;
      getAll(): Promise<any[]>;
      getById(id: number): Promise<any>;
      update(id: number, data: any): Promise<any>;
      remove(id: number): Promise<any>;
    };
    tutors: {
      create(data: any): Promise<any>;
      getAll(): Promise<any[]>;
      getById(id: number): Promise<any>;
      update(id: number, data: any): Promise<any>;
      remove(id: number): Promise<any>;
    };
    sessions: {
      create(data: any): Promise<any>;
      getByStudentId(id: number): Promise<any[]>;
      getById(id: number): Promise<any>;
      getDayNumber(studentId: number): Promise<number>;
    };
    articles: {
      getAll(): Promise<any[]>;
      getById(id: number): Promise<any>;
      create(data: any): Promise<any>;
      update(id: number, data: any): Promise<any>;
      remove(id: number): Promise<any>;
    };
    readingRecords: {
      create(data: any): Promise<any>;
      getBySessionId(id: number): Promise<any[]>;
      update(id: number, data: any): Promise<any>;
    };
    readingEvents: {
      create(data: any): Promise<any>;
      getByRecordId(id: number): Promise<any[]>;
      batchCreate(events: any[]): Promise<any>;
    };
    feedback: {
      saveStudent(data: any): Promise<any>;
      saveTutor(data: any): Promise<any>;
      getStudentByRecordId(id: number): Promise<any>;
      getTutorByRecordId(id: number): Promise<any>;
    };
    platform: string;
  };
}
