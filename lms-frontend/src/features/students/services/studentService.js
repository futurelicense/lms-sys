import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

/**
 * Uploads one photo and returns the storage key to submit with the student.
 *
 * Two steps by design: the API hands back a pre-signed URL and the browser PUTs
 * the file straight to object storage, so the image never passes through the
 * backend. The PUT deliberately uses fetch rather than the axios instance —
 * the storage host must not receive our Authorization header.
 */
async function uploadPhoto(file) {
  const { uploadUrl, photoKey } = await http.post(API_ENDPOINTS.students.photoUploadUrl, {
    fileName: file.name,
    mimeType: file.type,
  });

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  if (!response.ok) {
    throw new Error(`Photo upload failed (${response.status})`);
  }
  return photoKey;
}

export const studentService = {
  /** GET /students/reference-data — dropdown options for the intake form. */
  referenceData: () => http.get(API_ENDPOINTS.students.referenceData),

  /** GET /students?search=&batchId=&enrolmentStatus=&page=&size= */
  list: (params) =>
    http.get(API_ENDPOINTS.students.base, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        sort: 'createdAt,desc',
        search: params?.search || undefined,
        batchId: params?.batchId || undefined,
        enrolmentStatus: params?.enrolmentStatus || undefined,
      },
    }),

  /** GET /students/{id} */
  getById: (id) => http.get(API_ENDPOINTS.students.byId(id)),

  /** POST /students — creates the student record and the account behind it. */
  create: (payload) => http.post(API_ENDPOINTS.students.base, payload),

  /** PATCH /students/{id} */
  update: (id, payload) => http.patch(API_ENDPOINTS.students.byId(id), payload),

  /** DELETE /students/{id} */
  remove: (id) => http.delete(API_ENDPOINTS.students.byId(id)),

  uploadPhoto,
};

export default studentService;
