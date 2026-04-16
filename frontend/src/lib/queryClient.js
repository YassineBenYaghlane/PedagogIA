import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false }
  }
})

export const skillTreeKey = (studentId) => ["skillTree", studentId]

export const invalidateSkillTree = (studentId) => {
  if (!studentId) return
  queryClient.invalidateQueries({ queryKey: skillTreeKey(studentId) })
}
