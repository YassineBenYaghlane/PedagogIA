import { api } from "./client"

export const atelierApi = {
  audit: () => api.get("/exercises/audit/"),
  skill: (skillId) => api.get(`/exercises/audit/skill/${encodeURIComponent(skillId)}/`),
  preview: (templateId) =>
    api.get(`/exercises/templates/${encodeURIComponent(templateId)}/preview/`),
}
