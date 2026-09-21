import axios from 'axios';
import { http } from '../../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

export const assessmentService = {
  list: (params) => http.get(API_ENDPOINTS.assessments.base, { params }),
  getById: (id) => http.get(API_ENDPOINTS.assessments.byId(id)),
  startAttempt: (id, config) => http.post(API_ENDPOINTS.assessments.attempts(id), undefined, config),
  saveSubmissionDraft: (attemptId, questionId, language, sourceCode) =>
    http.post(API_ENDPOINTS.assessments.saveDraft(attemptId), { questionId, language, sourceCode }),
  submitAttempt: (attemptId) =>
    http.post(API_ENDPOINTS.assessments.submit(attemptId)),
  getResult: (attemptId) => http.get(API_ENDPOINTS.assessments.result(attemptId)),
  getAttemptHistory: (assessmentId) => http.get(API_ENDPOINTS.assessments.attemptsHistory(assessmentId)),
  getReport: (attemptId) => http.get(API_ENDPOINTS.assessments.report(attemptId)),
  getAssessmentAnalytics: (assessmentId) => http.get(API_ENDPOINTS.adminAssessments.analytics(assessmentId)),
  getRecordingPlaybackUrl: (attemptId) => http.get(API_ENDPOINTS.assessments.recordingPlaybackUrl(attemptId)),

  // Cloudflare R2 Recording Uploads
  getRecordingUploadUrl: (attemptId, payload) =>
    http.post(API_ENDPOINTS.assessments.recordingUploadUrl(attemptId), payload),

  completeRecordingUpload: (attemptId, payload) =>
    http.post(API_ENDPOINTS.assessments.completeRecording(attemptId), payload),

  uploadRecordingDirect: (attemptId, blob, durationSeconds) => {
    const formData = new FormData();
    formData.append('file', blob, `screen_recording_${attemptId}.webm`);
    if (durationSeconds) {
      formData.append('durationSeconds', durationSeconds);
    }
    return http.post(API_ENDPOINTS.assessments.uploadRecordingDirect(attemptId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Complete pipeline: Uploads screen recording blob directly to Cloudflare R2 via presigned PUT URL
   * with automatic fallback to direct multipart backend upload.
   */
  uploadAttemptRecording: async (attemptId, videoBlob, durationSeconds = 0) => {
    if (!attemptId || !videoBlob || videoBlob.size === 0) return null;

    try {
      // 1. Request presigned Cloudflare R2 PUT URL
      const urlRes = await assessmentService.getRecordingUploadUrl(attemptId, {
        contentType: videoBlob.type || 'video/webm',
        fileName: `screen_recording_${attemptId}.webm`,
        durationSeconds,
      });

      const { uploadUrl, key } = urlRes?.data ?? urlRes ?? {};

      if (uploadUrl && key) {
        // 2. Direct binary PUT upload to Cloudflare R2 bucket
        await axios.put(uploadUrl, videoBlob, {
          headers: {
            'Content-Type': videoBlob.type || 'video/webm',
          },
        });

        // 3. Finalize upload metadata on backend
        await assessmentService.completeRecordingUpload(attemptId, {
          key,
          durationSeconds,
        });

        return { key, success: true };
      }
    } catch (presignedErr) {
      console.warn('Presigned Cloudflare R2 upload fallback to direct backend upload:', presignedErr);
    }

    // Fallback: Direct backend upload
    try {
      await assessmentService.uploadRecordingDirect(attemptId, videoBlob, durationSeconds);
      return { success: true };
    } catch (directErr) {
      console.warn('Screen recording upload non-fatal failure:', directErr);
      return { success: false, error: directErr };
    }
  },
};

export default assessmentService;
