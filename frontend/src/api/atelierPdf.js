import { api } from "./client"

export const atelierPdfApi = {
  correctPage: ({ image, docTitle, pageNumber }) => {
    const body = new FormData()
    body.append("page_image", image, "page.png")
    body.append("doc_title", docTitle)
    body.append("page_number", String(pageNumber))
    return api.post("/pdf/correct-page/", body)
  },
  openChat: ({ studentId, feedback, docTitle, pageNumber }) =>
    api.post("/pdf/open-chat/", {
      student_id: studentId,
      feedback,
      doc_title: docTitle,
      page_number: pageNumber
    })
}
