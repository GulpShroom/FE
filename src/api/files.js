import { api } from './client'

/** POST /files — multipart field `file` */
export function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  return api.post('/files', form, { timeout: 60000 })
}
