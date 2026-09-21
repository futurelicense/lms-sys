import appConfig from '../config/appConfig';

export const formatBytes = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const getExtension = (filename = '') => filename.split('.').pop()?.toLowerCase() ?? '';

export const validateFile = (file, { accept = [], maxBytes = appConfig.maxUploadBytes } = {}) => {
  if (!file) return 'No file selected.';
  if (accept.length > 0 && !accept.includes(file.type)) {
    return `Unsupported file type. Allowed: ${accept.join(', ')}`;
  }
  if (file.size > maxBytes) {
    return `File is too large. Maximum size is ${formatBytes(maxBytes)}.`;
  }
  return null;
};

/** Saves a Blob returned by the API (certificates, exports) to disk. */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
