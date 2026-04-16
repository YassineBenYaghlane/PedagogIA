import { api } from "./client"

export const studentsApi = {
  skillTree: (studentId) => api.get(`/students/${studentId}/skill-tree/`)
}
