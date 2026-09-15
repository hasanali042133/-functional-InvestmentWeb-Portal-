import { Router } from 'express';
import * as accountController from '../controllers/account.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { uploadSingleFile } from '../middlewares/upload.js';
import {
  saveApplicationSchema,
  documentTypeSchema,
  documentIdParamSchema,
} from '../validators/account.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/application', accountController.getApplication);
router.put('/application', validate(saveApplicationSchema), accountController.saveApplication);
router.get('/status', accountController.getStatus);
router.post('/submit', accountController.submitApplication);

router.post(
  '/documents',
  uploadSingleFile('file'),
  validate(documentTypeSchema),
  accountController.uploadDocument,
);

router.delete(
  '/documents/:id',
  validate(documentIdParamSchema, 'params'),
  accountController.deleteDocument,
);

export default router;
