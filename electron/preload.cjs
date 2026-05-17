const { contextBridge, ipcRenderer } = require('electron');

const api = {
  // Students
  students: {
    create: (data) => ipcRenderer.invoke('db:students:create', data),
    getAll: () => ipcRenderer.invoke('db:students:getAll'),
    getById: (id) => ipcRenderer.invoke('db:students:getById', id),
    update: (id, data) => ipcRenderer.invoke('db:students:update', id, data),
    remove: (id) => ipcRenderer.invoke('db:students:remove', id),
  },

  // Tutors
  tutors: {
    create: (data) => ipcRenderer.invoke('db:tutors:create', data),
    getAll: () => ipcRenderer.invoke('db:tutors:getAll'),
    getById: (id) => ipcRenderer.invoke('db:tutors:getById', id),
    update: (id, data) => ipcRenderer.invoke('db:tutors:update', id, data),
    remove: (id) => ipcRenderer.invoke('db:tutors:remove', id),
  },

  // Sessions
  sessions: {
    create: (data) => ipcRenderer.invoke('db:sessions:create', data),
    getByStudentId: (id) => ipcRenderer.invoke('db:sessions:getByStudentId', id),
    getById: (id) => ipcRenderer.invoke('db:sessions:getById', id),
    getDayNumber: (studentId) =>
      ipcRenderer.invoke('db:sessions:getDayNumber', studentId),
  },

  // Articles
  articles: {
    getAll: () => ipcRenderer.invoke('db:articles:getAll'),
    getById: (id) => ipcRenderer.invoke('db:articles:getById', id),
    create: (data) => ipcRenderer.invoke('db:articles:create', data),
    update: (id, data) => ipcRenderer.invoke('db:articles:update', id, data),
    remove: (id) => ipcRenderer.invoke('db:articles:remove', id),
  },

  // Reading Records
  readingRecords: {
    create: (data) => ipcRenderer.invoke('db:readingRecords:create', data),
    getBySessionId: (id) =>
      ipcRenderer.invoke('db:readingRecords:getBySessionId', id),
    update: (id, data) =>
      ipcRenderer.invoke('db:readingRecords:update', id, data),
  },

  // Reading Events
  readingEvents: {
    create: (data) => ipcRenderer.invoke('db:readingEvents:create', data),
    getByRecordId: (id) =>
      ipcRenderer.invoke('db:readingEvents:getByRecordId', id),
    batchCreate: (events) =>
      ipcRenderer.invoke('db:readingEvents:batchCreate', events),
  },

  // Feedback
  feedback: {
    saveStudent: (data) =>
      ipcRenderer.invoke('db:feedback:saveStudent', data),
    saveTutor: (data) =>
      ipcRenderer.invoke('db:feedback:saveTutor', data),
    getStudentByRecordId: (id) =>
      ipcRenderer.invoke('db:feedback:getStudentByRecordId', id),
    getTutorByRecordId: (id) =>
      ipcRenderer.invoke('db:feedback:getTutorByRecordId', id),
  },

  // Misc
  platform: process.platform,
};

contextBridge.exposeInMainWorld('db', api);
