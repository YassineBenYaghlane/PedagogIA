import { api } from "./client"

export const accountApi = {
  updateUser: (patch) => api.patch("/auth/user/", patch),
  changePassword: ({ oldPassword, newPassword }) =>
    api.post("/auth/password/change/", {
      old_password: oldPassword,
      new_password1: newPassword,
      new_password2: newPassword
    })
}
