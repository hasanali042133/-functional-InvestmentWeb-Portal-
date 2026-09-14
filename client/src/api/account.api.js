import { api, unwrap } from './client.js';

/**
 * Account opening (KYC) endpoints.
 *
 * The application is saved section by section as a draft, so a customer can
 * leave a long form and come back to it. Submission is a separate call that
 * validates the whole thing.
 */

/** → { application, documents } */
export const getApplication = () => api.get('/api/account/application').then(unwrap);

/** Partial update — send only the section being saved. → { application } */
export const saveApplication = (payload) =>
  api.put('/api/account/application', payload).then(unwrap);

/** → { status, canInvest } */
export const getStatus = () => api.get('/api/account/status').then(unwrap);

/**
 * Uploads one document.
 *
 * @param {'CNIC_FRONT'|'CNIC_BACK'|'PROOF_OF_ADDRESS'} type
 * @param {File|Blob} file       the cropped blob when the customer cropped it
 * @param {boolean} isCropped
 * @param {(percent: number) => void} [onProgress]
 */
export const uploadDocument = ({ type, file, isCropped = false, onProgress }) => {
  const form = new FormData();
  form.append('type', type);
  form.append('isCropped', String(isCropped));
  form.append('file', file, file.name ?? `${type.toLowerCase()}.jpg`);

  return api
    .post('/api/account/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    })
    .then(unwrap);
};

export const deleteDocument = (id) => api.delete(`/api/account/documents/${id}`).then(unwrap);

/** Validates everything and approves. → { application } */
export const submitApplication = () => api.post('/api/account/submit').then(unwrap);
