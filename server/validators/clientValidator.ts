import { ValidatorFunction } from '../middleware/validationMiddleware';

export const validateClient: ValidatorFunction = (body: any) => {
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return 'Client Name represents standard business identity and cannot be blank.';
  }
  
  if (!body.constitution || !['Pvt Ltd', 'Public Ltd', 'LLP', 'OPC', 'Partnership', 'Proprietorship', 'Private Limited', 'Public Limited', 'Trust', 'Individual'].includes(body.constitution)) {
    return 'Constitution must be a valid legal entity structure (e.g., Pvt Ltd, Public Ltd, LLP, OPC).';
  }

  if (!body.pan || typeof body.pan !== 'string') {
    return 'Permanent Account Number (PAN) is mandatory.';
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(body.pan.toUpperCase())) {
    return 'Invalid PAN format! Must match Indian tax regulations (e.g., AAACA1234F).';
  }

  return null;
};
