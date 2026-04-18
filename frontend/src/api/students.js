import { api } from "./client"

export const studentsApi = {
  skillTree: (studentId) => api.get(`/students/${studentId}/skill-tree/`),
  update: (studentId, patch) => api.patch(`/students/${studentId}/`, patch),
  remove: (studentId) => api.delete(`/students/${studentId}/`)
}
