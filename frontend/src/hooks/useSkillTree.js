import { useQuery } from "@tanstack/react-query"
import { studentsApi } from "../api/students"
import { skillTreeKey } from "../lib/queryClient"

export function useSkillTree(studentId) {
  return useQuery({
    queryKey: skillTreeKey(studentId),
    queryFn: () => studentsApi.skillTree(studentId),
    enabled: Boolean(studentId)
  })
}
