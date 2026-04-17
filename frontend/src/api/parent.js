import { api } from "./client"

export const fetchParentOverview = () => api.get("/parent/overview/")
