import { api } from "./client"

export const playgroundApi = {
  listTemplates: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.grade) params.set("grade", filters.grade)
    if (filters.skillId) params.set("skill_id", filters.skillId)
    if (filters.inputType) params.set("input_type", filters.inputType)
    if (filters.difficulty) params.set("difficulty", String(filters.difficulty))
    const qs = params.toString()
    return api.get(`/exercises/playground/templates/${qs ? `?${qs}` : ""}`)
  },
  instantiate: (templateId, paramsOverride = null) =>
    api.post("/exercises/playground/instantiate/", {
      template_id: templateId,
      params_override: paramsOverride,
    }),
}
