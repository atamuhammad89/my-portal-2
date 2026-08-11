export type PhoneNumberCapability = 'voice' | 'sms' | 'mms' | 'fax' | 'emergency';

export type PhoneNumberType = 'local' | 'toll_free' | 'national' | 'mobile';

export interface AvailableNumber {
  phoneNumber: string;
  countryCode: string;
  state?: string;
  locality?: string;
  type: PhoneNumberType;
  capabilities: PhoneNumberCapability[];
  cost?: number;
}

export type OrderStatus = 'pending' | 'processing' | 'success' | 'failure' | 'cancelled';

export interface NumberOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  phoneNumbers: string[];
  requirementsMet: boolean;
  subOrderIds: string[];
  customerReference?: string;
  userId?: string;
  userEmail?: string;
}

export interface TelecomNumber {
  id: string;
  phoneNumber: string;
  status: string;
  countryCode: string;
  type: PhoneNumberType;
  capabilities: PhoneNumberCapability[];
  purchasedAt?: string;
  agentId?: string;
  userId?: string;
  userEmail?: string;
}

export interface ComplianceField {
  name: string;
  label: string;
  type: 'text' | 'file' | 'select';
  description?: string;
  required: boolean;
  options?: { label: string; value: string }[];
}

export interface ComplianceRequirement {
  id: string;
  type: string;
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  requiredFields: ComplianceField[];
}

export interface SearchFilters {
  country: string;
  areaCode?: string;
  type?: PhoneNumberType | 'all' | string;
  features?: PhoneNumberCapability[];
  limit?: number;
  page?: number;
}

export interface CountryOption {
  code: string;
  name: string;
  complianceRequired?: boolean;
}

export const TELNYX_COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'United States' },
  { code: 'IE', name: 'Ireland', complianceRequired: true },
  { code: 'GB', name: 'United Kingdom', complianceRequired: true },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany', complianceRequired: true },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria', complianceRequired: true },
  { code: 'BE', name: 'Belgium', complianceRequired: true },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France', complianceRequired: true },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy', complianceRequired: true },
  { code: 'JP', name: 'Japan' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain', complianceRequired: true },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'VN', name: 'Vietnam' },
];
