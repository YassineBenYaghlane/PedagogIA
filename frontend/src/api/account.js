import { api } from "./client"

export const accountApi = {
  updateUser: (patch) => api.patch("/auth/user/", patch),
  changePassword: ({ oldPassword, newPassword }) =>
    api.post("/auth/password/change/", {
      old_password: oldPassword,
      new_password1: newPassword,
      new_password2: newPassword
    }),
  verifyEmail: (key) => api.post("/auth/registration/verify-email/", { key }),
  resendVerificationEmail: (email) =>
    api.post("/auth/registration/resend-email/", { email })
}
