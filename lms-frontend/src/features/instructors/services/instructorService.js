import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

/**
 * Uploads one photo and returns the storage key to submit with the instructor.
 *
 * Two steps by design: the API hands back a pre-signed URL and the browser PUTs
 * the file straight to object storage, so the image never passes through the
 * backend. The PUT deliberately uses fetch rather than the axios instance —
 * the storage host must not receive our Authorization header.
 */
async function uploadPhoto(file) {
  const { uploadUrl, photoKey } = await http.post(API_ENDPOINTS.instructors.photoUploadUrl, {
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

export const instructorService = {
  /** GET /instructors/reference-data */
  referenceData: () => http.get(API_ENDPOINTS.instructors.referenceData),

  /** GET /instructors?search=&employmentType=&page=&size= */
  list: (params) =>
    http.get(API_ENDPOINTS.instructors.base, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        sort: 'createdAt,desc',
        search: params?.search || undefined,
        employmentType: params?.employmentType || undefined,
      },
    }),

  /** GET /instructors/{id} — includes assigned batches */
  getById: (id) => http.get(API_ENDPOINTS.instructors.byId(id)),

  /** POST /instructors — creates the record and the account behind it */
  create: (payload) => http.post(API_ENDPOINTS.instructors.base, payload),

  /** PATCH /instructors/{id} */
  update: (id, payload) => http.patch(API_ENDPOINTS.instructors.byId(id), payload),

  /** DELETE /instructors/{id} */
  remove: (id) => http.delete(API_ENDPOINTS.instructors.byId(id)),

  uploadPhoto,
};

export default instructorService;
