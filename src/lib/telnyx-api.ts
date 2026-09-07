import axios from 'axios';
import {
  AvailableNumber,
  NumberOrder,
  TelecomNumber,
  ComplianceRequirement,
  ComplianceField,
  SearchFilters,
  OrderStatus,
  PhoneNumberCapability,
  PhoneNumberType,
} from '@/types/telecom';

export function isTelnyxConfigured(): boolean {
  return !!process.env.TELNYX_API_KEY?.trim();
}

function getTelnyxClient() {
  const apiToken = process.env.TELNYX_API_KEY?.trim() || '';
  const baseURL = process.env.TELNYX_BASE_URL || 'https://api.telnyx.com/v2';

  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    timeout: 15000,
  });
}

let mockPurchasedNumbers: TelecomNumber[] = [];
let mockOrders: NumberOrder[] = [
  {
    id: 'ord-9e8d7c6b-5a4f',
    status: 'success',
    createdAt: '2026-07-10T10:15:00.000Z',
    phoneNumbers: ['+14155552671'],
    requirementsMet: true,
    subOrderIds: [],
    customerReference: 'REF-US-OFFICE',
  },
  {
    id: 'ord-1a2b3c4d-5e6f',
    status: 'pending',
    createdAt: '2026-07-13T18:10:00.000Z',
    phoneNumbers: ['+442079460192'],
    requirementsMet: false,
    subOrderIds: ['sub-442079460192'],
    customerReference: 'REF-UK-BRANCH',
  },
];

let mockComplianceRequirements: Record<string, ComplianceRequirement[]> = {
  'sub-442079460192': [
    {
      id: 'req-uk-proof-id',
      type: 'document',
      name: 'Proof of Identity',
      description: 'Upload a scan of a passport, driver license, or national ID card.',
      status: 'not_submitted',
      requiredFields: [
        {
          name: 'passport_scan',
          label: 'ID Document Scan (PDF/Image)',
          type: 'file',
          description: 'Max size 5MB. Must be in color and clear.',
          required: true,
        },
        {
          name: 'full_name',
          label: 'Full Name on Document',
          type: 'text',
          description: 'Must match the document exactly.',
          required: true,
        },
      ],
    },
    {
      id: 'req-uk-proof-address',
      type: 'document',
      name: 'Proof of Address',
      description: 'Upload a utility bill or bank statement showing your name and UK address.',
      status: 'not_submitted',
      requiredFields: [
        {
          name: 'utility_bill',
          label: 'Utility Bill Scan',
          type: 'file',
          description: 'Dated within the last 3 months.',
          required: true,
        },
        {
          name: 'postal_code',
          label: 'UK Postal Code',
          type: 'text',
          description: 'e.g. SW1A 1AA',
          required: true,
        },
      ],
    },
  ],
};

const MOCK_AVAILABLE_NUMBERS: AvailableNumber[] = [
  { phoneNumber: '+12025550143', countryCode: 'US', state: 'DC', locality: 'Washington', type: 'local', capabilities: ['voice', 'sms', 'mms'], cost: 1.00 },
  { phoneNumber: '+12125550188', countryCode: 'US', state: 'NY', locality: 'New York', type: 'local', capabilities: ['voice', 'sms'], cost: 1.25 },
  { phoneNumber: '+13125550109', countryCode: 'US', state: 'IL', locality: 'Chicago', type: 'local', capabilities: ['voice', 'sms', 'mms'], cost: 1.10 },
  { phoneNumber: '+18885559812', countryCode: 'US', type: 'toll_free', capabilities: ['voice', 'sms'], cost: 2.50 },
  { phoneNumber: '+18005559090', countryCode: 'US', type: 'toll_free', capabilities: ['voice', 'sms', 'mms'], cost: 3.00 },
  { phoneNumber: '+35314960192', countryCode: 'IE', locality: 'Dublin', type: 'local', capabilities: ['voice', 'sms'], cost: 2.50 },
  { phoneNumber: '+442079460192', countryCode: 'GB', locality: 'London', type: 'local', capabilities: ['voice', 'sms'], cost: 2.00 },
  { phoneNumber: '+14165550123', countryCode: 'CA', state: 'ON', locality: 'Toronto', type: 'local', capabilities: ['voice', 'sms', 'mms'], cost: 1.50 },
  { phoneNumber: '+493022445566', countryCode: 'DE', locality: 'Berlin', type: 'local', capabilities: ['voice'], cost: 2.20 },
  { phoneNumber: '+61291234567', countryCode: 'AU', locality: 'Sydney', type: 'local', capabilities: ['voice', 'sms'], cost: 2.80 },
];

export function updateMockNumberAgent(phoneNumber: string, agentId?: string) {
  const num = mockPurchasedNumbers.find((n) => n.phoneNumber === phoneNumber);
  if (num) {
    num.agentId = agentId;
    return true;
  }
  return false;
}

export async function searchAvailableNumbers(filters: SearchFilters): Promise<AvailableNumber[]> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;

  if (!isTelnyxConfigured()) {
    let filtered = MOCK_AVAILABLE_NUMBERS.filter((num) => {
      if (filters.country && num.countryCode.toLowerCase() !== filters.country.toLowerCase()) return false;
      if (filters.areaCode && !num.phoneNumber.includes(filters.areaCode.replace(/\D/g, ''))) return false;
      if (filters.type && filters.type !== 'all' && num.type !== filters.type) return false;
      if (filters.features && filters.features.length > 0) {
        if (!filters.features.every((f) => num.capabilities.includes(f))) return false;
      }
      return true;
    });

    if (filtered.length === 0 && filters.country) {
      const countryCode = filters.country.toUpperCase();
      const prefixMap: Record<string, string> = { IE: '+3531', US: '+1202', GB: '+4420', CA: '+1416', DE: '+4930', FR: '+331', AU: '+612' };
      const prefix = prefixMap[countryCode] || `+155`;
      filtered = Array.from({ length: 25 }, (_, i) => ({
        phoneNumber: `${prefix}${Math.floor(1000000 + (i * 12345) % 8999999)}`,
        countryCode,
        locality: countryCode === 'IE' ? (i % 2 === 0 ? 'Dublin' : 'Cork') : 'City Center',
        type: (filters.type && filters.type !== 'all' ? filters.type : 'local') as PhoneNumberType,
        capabilities: ['voice', 'sms', 'mms'],
        cost: 1.50 + (i % 3) * 0.5,
      }));
    }

    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }

  try {
    const params: Record<string, any> = {
      'filter[country_code]': filters.country,
      'page[size]': limit,
      'page[number]': page,
    };
    if (filters.areaCode) {
      if (['US', 'CA'].includes(filters.country.toUpperCase())) {
        params['filter[area_code]'] = filters.areaCode;
      } else {
        params['filter[national_destination_code]'] = filters.areaCode;
      }
    }
    if (filters.type && filters.type !== 'all') params['filter[number_type]'] = filters.type === 'toll_free' ? 'toll-free' : filters.type;
    if (filters.features && filters.features.length > 0) params['filter[features]'] = filters.features.join(',');

    const res = await getTelnyxClient().get('/available_phone_numbers', { params });
    const rawData = res.data?.data || [];

    // Log the first item to help debug field names
    if (rawData.length > 0) {
      console.log('[Telnyx Search] Sample raw item keys:', Object.keys(rawData[0]));
      console.log('[Telnyx Search] Sample raw item:', JSON.stringify(rawData[0], null, 2));
    }

    return rawData.map((item: any) => {
      // Parse capabilities - features can be an array of objects OR an object with keys
      const capabilities: string[] = [];
      if (Array.isArray(item.features)) {
        item.features.forEach((f: any) => {
          if (typeof f === 'string') {
            capabilities.push(f);
          } else if (f && (f.status === 'supported' || f.status === 'available' || f.status === 'enabled')) {
            capabilities.push(f.name);
          }
        });
      } else if (item.features && typeof item.features === 'object') {
        Object.keys(item.features).forEach((key) => {
          const val = item.features[key];
          if (val && (val.status === 'supported' || val.status === 'available' || val.status === 'enabled' || val === true)) {
            capabilities.push(key);
          }
        });
      }

      // Determine number type - check multiple possible field names
      const rawType = item.number_type || item.phone_number_type || item.type || '';
      const type = rawType === 'toll-free' ? 'toll_free' : (rawType || 'local');

      // Determine locality from multiple possible fields
      const locality = item.locality || item.city || item.region || undefined;
      const state = item.administrative_area || item.state || item.region_information?.[0]?.region_name || undefined;

      let telnyxPrice = 0;
      const costInfo = item.cost_information;
      if (costInfo) {
        const rawCost = costInfo.monthly_cost ?? costInfo.monthly_recurring_cost ?? costInfo.monthly_recurring_price ?? costInfo.upfront_cost;
        if (rawCost !== undefined && rawCost !== null) {
          telnyxPrice = parseFloat(String(rawCost));
        }
      }
      if (!telnyxPrice || isNaN(telnyxPrice)) {
        const rootCost = item.monthly_cost ?? item.cost ?? item.price;
        if (rootCost !== undefined && rootCost !== null) {
          telnyxPrice = parseFloat(String(rootCost));
        }
      }

      if (isNaN(telnyxPrice) || telnyxPrice <= 0) {
        telnyxPrice = 1.00;
      }

      return {
        phoneNumber: item.phone_number,
        countryCode: item.country_code || filters.country,
        state,
        locality,
        type,
        capabilities: capabilities.length > 0 ? capabilities : ['voice'],
        cost: telnyxPrice,
      };
    });
  } catch (error: any) {
    throw new Error(`Telnyx Search Error: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
  }
}

export async function createNumberOrder(
  phoneNumber: string,
  customerReference?: string,
  regulatoryRequirements?: Record<string, string>
): Promise<NumberOrder> {
  if (!isTelnyxConfigured()) {
    const isComplianceRequired = ['GB', 'DE', 'IE', 'FR', 'IT', 'ES', 'AT', 'BE'].some((c) => phoneNumber.startsWith(`+${c === 'GB' ? '44' : c === 'DE' ? '49' : c === 'IE' ? '353' : '33'}`));
    const orderId = `ord-${Math.random().toString(36).substring(2, 10)}`;
    const subOrderId = isComplianceRequired ? `sub-${phoneNumber.replace(/\D/g, '')}` : `sub-none`;

    const newOrder: NumberOrder = {
      id: orderId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      phoneNumbers: [phoneNumber],
      requirementsMet: !isComplianceRequired,
      subOrderIds: isComplianceRequired ? [subOrderId] : [],
      customerReference: customerReference || 'WEB_PORTAL_ORDER',
    };

    mockOrders.unshift(newOrder);

    if (isComplianceRequired) {
      mockComplianceRequirements[subOrderId] = [
        {
          id: `req-${subOrderId}-id`,
          type: 'document',
          name: 'Proof of Identity',
          description: `Upload identity document for ${phoneNumber}.`,
          status: 'not_submitted',
          requiredFields: [
            { name: 'passport_scan', label: 'ID Scan', type: 'file', required: true },
            { name: 'full_name', label: 'Full Name', type: 'text', required: true },
          ],
        },
      ];
      if (regulatoryRequirements && Object.keys(regulatoryRequirements).length > 0) {
        newOrder.requirementsMet = true;
        newOrder.status = 'success';
        mockPurchasedNumbers.unshift({
          id: `num-${Math.random().toString(36).substring(2, 10)}`,
          phoneNumber,
          status: 'active',
          countryCode: 'GB',
          type: 'local',
          capabilities: ['voice', 'sms'],
          purchasedAt: new Date().toISOString(),
        });
      }
    } else {
      setTimeout(() => {
        const ord = mockOrders.find((o) => o.id === orderId);
        if (ord) ord.status = 'success';
        mockPurchasedNumbers.unshift({
          id: `num-${Math.random().toString(36).substring(2, 10)}`,
          phoneNumber,
          status: 'active',
          countryCode: 'US',
          type: 'local',
          capabilities: ['voice', 'sms'],
          purchasedAt: new Date().toISOString(),
        });
      }, 5000);
    }

    return newOrder;
  }

  try {
    const getCountryCode = (num: string) => {
      if (num.startsWith('+353')) return 'IE';
      if (num.startsWith('+44')) return 'GB';
      if (num.startsWith('+49')) return 'DE';
      if (num.startsWith('+33')) return 'FR';
      if (num.startsWith('+39')) return 'IT';
      if (num.startsWith('+34')) return 'ES';
      if (num.startsWith('+43')) return 'AT';
      if (num.startsWith('+32')) return 'BE';
      if (num.startsWith('+61')) return 'AU';
      return 'US';
    };
    const countryCode = getCountryCode(phoneNumber);

    // Build regulatory requirements payload if provided
    let regulatoryPayload: any[] = [];
    if (regulatoryRequirements && Object.keys(regulatoryRequirements).length > 0) {
      regulatoryPayload = await Promise.all(
        Object.entries(regulatoryRequirements).map(async ([key, val]) => {
          let finalVal = val;
          if (typeof val === 'string' && val.startsWith('data:')) {
            finalVal = await uploadTelnyxDocument(val);
          }
          return {
            requirement_id: key.split('_')[0],
            field_value: finalVal,
          };
        })
      );
    }

    // Attempt to create a requirement group if requirements were submitted
    let requirementGroupId: string | null = null;
    if (regulatoryPayload.length > 0) {
      try {
        const rgRes = await getTelnyxClient().post('/requirement_groups', {
          country_code: countryCode,
          phone_number_type: 'local',
          action: 'ordering',
          regulatory_requirements: regulatoryPayload,
        });
        requirementGroupId = rgRes.data?.data?.id || null;

        if (requirementGroupId) {
          try {
            await getTelnyxClient().post(`/requirement_groups/${requirementGroupId}/submit_for_approval`);
          } catch (subErr: any) {
            console.warn('[Requirement Group Submit for Approval Warning]', subErr.response?.data || subErr.message);
          }
        }
      } catch (rgErr: any) {
        console.warn('[Requirement Group Creation Warning]', rgErr.response?.data || rgErr.message);
      }
    }

    // Check for existing requirement groups for country if none created yet
    if (!requirementGroupId) {
      try {
        const existingGroupsRes = await getTelnyxClient().get('/requirement_groups', {
          params: { 'filter[country_code]': countryCode, 'filter[action]': 'ordering' }
        });
        const groups = existingGroupsRes.data?.data || [];
        if (groups.length > 0) {
          requirementGroupId = groups[0].id;
        }
      } catch (e) {}
    }

    const phoneNumberItem: Record<string, any> = { phone_number: phoneNumber };
    if (requirementGroupId) {
      phoneNumberItem.requirement_group_id = requirementGroupId;
    } else if (regulatoryPayload.length > 0) {
      phoneNumberItem.regulatory_requirements = regulatoryPayload;
    }

    const payload: Record<string, any> = {
      phone_numbers: [phoneNumberItem],
    };
    if (customerReference) payload.customer_reference = customerReference;

    let res;
    try {
      res = await getTelnyxClient().post('/number_orders', payload);
    } catch (firstErr: any) {
      const errCode = firstErr.response?.data?.errors?.[0]?.code;
      const errDetail = firstErr.response?.data?.errors?.[0]?.detail || firstErr.message || '';

      // Code 10027: Requirement group is not approved yet (compliance submitted and pending Telnyx carrier review)
      if (errCode === '10027' || errDetail.toLowerCase().includes('not approved') || errDetail.toLowerCase().includes('compliance not cleared')) {
        console.info('[Telnyx Order Requirement Group Pending Review]', errDetail);
        return {
          id: requirementGroupId ? `ord-rg-${requirementGroupId}` : `ord-${Math.random().toString(36).substring(2, 10)}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          phoneNumbers: [phoneNumber],
          requirementsMet: false,
          subOrderIds: requirementGroupId ? [requirementGroupId] : [],
          customerReference: customerReference || 'REGULATORY_PENDING',
        };
      }

      if (errDetail.toLowerCase().includes('requirement group') || errDetail.toLowerCase().includes('requirement')) {
        let fallbackGroupId: string | null = null;
        try {
          const countryReqs = await getCountryRegulatoryRequirements(countryCode, 'local');
          const defaultPayload = countryReqs.flatMap(req => 
            req.requiredFields.map(f => ({
              requirement_id: f.name.split('_')[0] || req.id,
              field_value: 'Pending Documentation',
            }))
          );

          if (defaultPayload.length > 0) {
            const rgRes = await getTelnyxClient().post('/requirement_groups', {
              country_code: countryCode,
              phone_number_type: 'local',
              action: 'ordering',
              regulatory_requirements: defaultPayload,
            });
            fallbackGroupId = rgRes.data?.data?.id || null;
            if (fallbackGroupId) {
              await getTelnyxClient().post(`/requirement_groups/${fallbackGroupId}/submit_for_approval`).catch(() => {});
            }
          }
        } catch (rgCreateErr) {
          console.warn('[Fallback Requirement Group Create Warning]', rgCreateErr);
        }

        if (fallbackGroupId) {
          try {
            phoneNumberItem.requirement_group_id = fallbackGroupId;
            res = await getTelnyxClient().post('/number_orders', {
              phone_numbers: [phoneNumberItem],
              ...(customerReference ? { customer_reference: customerReference } : {})
            });
          } catch (retryErr: any) {
            const rCode = retryErr.response?.data?.errors?.[0]?.code;
            const rDetail = retryErr.response?.data?.errors?.[0]?.detail || retryErr.message || '';
            if (rCode === '10027' || rDetail.toLowerCase().includes('not approved') || rDetail.toLowerCase().includes('compliance not cleared')) {
              return {
                id: `ord-rg-${fallbackGroupId}`,
                status: 'pending',
                createdAt: new Date().toISOString(),
                phoneNumbers: [phoneNumber],
                requirementsMet: false,
                subOrderIds: [fallbackGroupId],
                customerReference: customerReference || 'REGULATORY_PENDING',
              };
            }
            throw retryErr;
          }
        } else {
          throw firstErr;
        }
      } else {
        throw firstErr;
      }
    }

    const data = res.data?.data;
    const subOrderIds = data.sub_number_orders_ids || [];

    return {
      id: data.id,
      status: data.status?.toLowerCase() === 'completed' ? 'success' : data.status?.toLowerCase() || 'pending',
      createdAt: data.created_at,
      phoneNumbers: data.phone_numbers?.map((p: any) => p.phone_number) || [phoneNumber],
      requirementsMet: data.requirements_met,
      subOrderIds,
      customerReference: data.customer_reference,
    };
  } catch (error: any) {
    console.error('[Telnyx Order Error]', error.response?.data || error.message);
    throw new Error(`Telnyx Order Error: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
  }
}

export async function getOrder(orderId: string): Promise<NumberOrder> {
  if (!isTelnyxConfigured()) {
    const ord = mockOrders.find((o) => o.id === orderId);
    if (!ord) throw new Error(`Order ${orderId} not found.`);
    return ord;
  }

  try {
    const res = await getTelnyxClient().get(`/number_orders/${orderId}`);
    const data = res.data?.data;
    return {
      id: data.id,
      status: data.status?.toLowerCase() === 'completed' ? 'success' : data.status?.toLowerCase() || 'pending',
      createdAt: data.created_at,
      phoneNumbers: data.phone_numbers?.map((p: any) => p.phone_number) || [],
      requirementsMet: data.requirements_met,
      subOrderIds: data.sub_number_orders_ids || [],
      customerReference: data.customer_reference,
    };
  } catch (error: any) {
    throw new Error(`Telnyx Order Fetch Error: ${error.message}`);
  }
}

export async function getOrders(): Promise<NumberOrder[]> {
  if (!isTelnyxConfigured()) return mockOrders;
  try {
    const res = await getTelnyxClient().get('/number_orders', { params: { 'page[size]': 50 } });
    const rawData = res.data?.data || [];
    return rawData.map((data: any) => ({
      id: data.id,
      status: data.status?.toLowerCase() === 'completed' ? 'success' : data.status?.toLowerCase() || 'pending',
      createdAt: data.created_at,
      phoneNumbers: data.phone_numbers?.map((p: any) => p.phone_number) || [],
      requirementsMet: data.requirements_met,
      subOrderIds: data.sub_number_orders_ids || [],
      customerReference: data.customer_reference,
    }));
  } catch (error: any) {
    throw new Error(`Telnyx Orders List Error: ${error.message}`);
  }
}

export async function getPurchasedNumbers(): Promise<TelecomNumber[]> {
  if (!isTelnyxConfigured()) return mockPurchasedNumbers;
  try {
    const res = await getTelnyxClient().get('/phone_numbers', { params: { 'page[size]': 100 } });
    const rawData = res.data?.data || [];
    return rawData.map((item: any) => ({
      id: item.id,
      phoneNumber: item.phone_number,
      status: item.status,
      countryCode: item.country_code,
      type: item.number_type === 'toll-free' ? 'toll_free' : item.number_type,
      capabilities: ['voice', 'sms'],
      purchasedAt: item.created_at || item.purchased_at,
    }));
  } catch (error: any) {
    throw new Error(`Telnyx Numbers List Error: ${error.message}`);
  }
}

export async function getComplianceRequirements(subOrderId: string): Promise<ComplianceRequirement[]> {
  if (!isTelnyxConfigured()) return mockComplianceRequirements[subOrderId] || [];
  try {
    const res = await getTelnyxClient().get(`/sub_number_orders/${subOrderId}`);
    const data = res.data?.data;
    return (data?.regulatory_requirements || []).map((req: any) => ({
      id: req.id,
      type: req.field_type || 'document',
      name: req.name,
      description: req.description || req.acceptance_criteria || 'Regulatory requirement submission required.',
      status: req.status === 'approved' ? 'approved' : 'not_submitted',
      requiredFields: [
        { name: `${req.id}_text`, label: req.name, type: 'text', required: true }
      ],
    }));
  } catch (error: any) {
    throw new Error(`Telnyx Compliance Error: ${error.message}`);
  }
}

export async function uploadTelnyxDocument(dataUrl: string, filename?: string): Promise<string> {
  if (!isTelnyxConfigured()) {
    return `doc_mock_${Math.random().toString(36).substring(2, 9)}`;
  }

  try {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return dataUrl;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType.split('/')[1] || 'pdf';
    const name = filename || `compliance_doc_${Date.now()}.${ext}`;

    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, name);

    const res = await getTelnyxClient().post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data?.data?.id || dataUrl;
  } catch (err: any) {
    console.error('[Telnyx Document Upload Error]', err.response?.data || err.message);
    return dataUrl;
  }
}

export async function submitCompliance(subOrderId: string, requirements: Record<string, string>): Promise<NumberOrder> {
  if (!isTelnyxConfigured()) {
    const parentOrder = mockOrders.find((o) => o.subOrderIds.includes(subOrderId));
    if (parentOrder) {
      parentOrder.status = 'processing';
      setTimeout(() => {
        parentOrder.requirementsMet = true;
        parentOrder.status = 'success';
        parentOrder.phoneNumbers.forEach((num) => {
          if (!mockPurchasedNumbers.some((pn) => pn.phoneNumber === num)) {
            mockPurchasedNumbers.unshift({
              id: `num-${Math.random().toString(36).substring(2, 10)}`,
              phoneNumber: num,
              status: 'active',
              countryCode: 'GB',
              type: 'local',
              capabilities: ['voice', 'sms'],
              purchasedAt: new Date().toISOString(),
            });
          }
        });
      }, 6000);
    }
    return parentOrder || mockOrders[0];
  }

  try {
    const regulatoryPayload = await Promise.all(
      Object.entries(requirements).map(async ([key, val]) => {
        let finalVal = val;
        if (typeof val === 'string' && val.startsWith('data:')) {
          finalVal = await uploadTelnyxDocument(val);
        }
        return {
          requirement_id: key.split('_')[0],
          field_value: finalVal,
        };
      })
    );

    let subOrderData;
    try {
      const res = await getTelnyxClient().patch(`/sub_number_orders/${subOrderId}`, { regulatory_requirements: regulatoryPayload });
      subOrderData = res.data?.data;
    } catch (subErr) {
      try {
        const res = await getTelnyxClient().patch(`/requirement_groups/${subOrderId}`, { regulatory_requirements: regulatoryPayload });
        await getTelnyxClient().post(`/requirement_groups/${subOrderId}/submit_for_approval`).catch(() => {});
        subOrderData = res.data?.data;
      } catch (rgErr: any) {
        console.warn('[Requirement Group Patch Warning]', rgErr.response?.data || rgErr.message);
      }
    }

    if (subOrderData?.phone_number_order_id) {
      return await getOrder(subOrderData.phone_number_order_id);
    }
    return {
      id: `ord-rg-${subOrderId}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      phoneNumbers: [],
      requirementsMet: false,
      subOrderIds: [subOrderId],
      customerReference: 'COMPLIANCE_SUBMITTED',
    };
  } catch (error: any) {
    throw new Error(`Telnyx Submit Compliance Error: ${error.message}`);
  }
}

export async function getCountryRegulatoryRequirements(
  countryCode: string,
  phoneNumberType: string = 'local'
): Promise<ComplianceRequirement[]> {
  const code = countryCode.toUpperCase();
  const telnyxType = phoneNumberType === 'toll_free' ? 'toll-free' : phoneNumberType;
  const requiresCompliance = ['GB', 'DE', 'IE', 'FR', 'IT', 'ES', 'AT', 'BE'].includes(code);

  const fallbackRequirements: ComplianceRequirement[] = [
    {
      id: `req-${code}-identity`,
      type: 'document',
      name: 'Government-Issued ID / Passport / Company Registration',
      description: `Clear scan or photo of ID, Passport, or Business Registration for carrier authorization in ${code}.`,
      status: 'not_submitted',
      requiredFields: [
        {
          name: `proof_identity`,
          label: 'Passport Copy / Identity Document Upload',
          type: 'file',
          required: true,
          description: 'Upload copy of passport, driver license, or identity card (PDF, PNG, JPG).',
        },
        {
          name: `full_legal_name`,
          label: 'Full Legal Name on Document',
          type: 'text',
          required: true,
          description: 'Enter full legal name as it appears on your document.',
        },
      ],
    },
    {
      id: `req-${code}-address`,
      type: 'address',
      name: 'Physical Address Registration & Proof of Bill',
      description: `Physical deliverable address in ${code} for official carrier registration.`,
      status: 'not_submitted',
      requiredFields: [
        {
          name: `physical_address`,
          label: 'Physical Address Details',
          type: 'address',
          required: true,
          description: 'Register street address, city, and postal code.',
        },
        {
          name: `proof_of_address_file`,
          label: 'Proof of Address / Utility Bill Upload',
          type: 'file',
          required: true,
          description: 'Upload utility bill, bank invoice, or tax statement (PDF, PNG, JPG).',
        },
      ],
    },
    {
      id: `req-${code}-usecase`,
      type: 'textual',
      name: 'Business Use Case Description',
      description: 'Explanation of how this number will be used in your business.',
      status: 'not_submitted',
      requiredFields: [
        {
          name: `business_usecase`,
          label: 'Business Use Case Description',
          type: 'text',
          required: true,
          description: 'e.g. Inbound customer service line for retail store.',
        },
      ],
    },
  ];

  if (!isTelnyxConfigured()) {
    return requiresCompliance ? fallbackRequirements : [];
  }

  try {
    let rawData: any[] = [];
    try {
      const res = await getTelnyxClient().get('/requirements', {
        params: {
          'filter[country_code]': code,
          'filter[phone_number_type]': telnyxType,
          'filter[action]': 'ordering',
        },
      });
      rawData = res.data?.data || [];
    } catch (primaryErr) {
      try {
        const res = await getTelnyxClient().get('/regulatory_requirements', {
          params: {
            'filter[country_code]': code,
            'filter[phone_number_type]': telnyxType,
            'filter[action]': 'ordering',
          },
        });
        rawData = res.data?.data || [];
      } catch (e) {}
    }

    const itemsList: any[] = [];
    (rawData || []).forEach((item: any) => {
      if (Array.isArray(item.requirement_types) && item.requirement_types.length > 0) {
        itemsList.push(...item.requirement_types);
      } else if (Array.isArray(item.regulatory_requirements) && item.regulatory_requirements.length > 0) {
        itemsList.push(...item.regulatory_requirements);
      } else if (Array.isArray(item.requirements) && item.requirements.length > 0) {
        itemsList.push(...item.requirements);
      } else {
        itemsList.push(item);
      }
    });

    if (itemsList.length === 0) {
      return requiresCompliance ? fallbackRequirements : [];
    }

    const mapped = itemsList.map((req: any, idx: number) => {
      const reqTypeObj = req.requirement_type || req;
      const title =
        req.name ||
        reqTypeObj.name ||
        reqTypeObj.title ||
        req.title ||
        req.label ||
        (reqTypeObj.type ? `${reqTypeObj.type.toUpperCase()} Verification` : null) ||
        `Carrier Regulatory Requirement ${idx + 1}`;

      const description =
        req.description ||
        reqTypeObj.description ||
        req.example ||
        req.acceptance_criteria ||
        `Carrier regulatory document requirement for ${code}.`;

      const rawType = (
        req.field_type ||
        reqTypeObj.type ||
        reqTypeObj.field_type ||
        req.type ||
        ''
      ).toLowerCase();

      let reqType: 'text' | 'file' | 'address' | 'action' = 'text';
      if (rawType.includes('address')) {
        reqType = 'address';
      } else if (rawType.includes('action') || rawType.includes('external')) {
        reqType = 'action';
      } else if (
        rawType.includes('document') ||
        rawType.includes('file') ||
        /\b(id|passport|document|certificate|file|proof|scan|bill|invoice|license|copy)\b/i.test(title)
      ) {
        reqType = 'file';
      }

      const reqId = req.id || reqTypeObj.id || `req_${idx}_${Date.now()}`;

      return {
        id: reqId,
        type: reqType === 'file' ? 'document' : reqType,
        name: title,
        description: description,
        status: (req.status === 'approved' ? 'approved' : 'not_submitted') as 'approved' | 'not_submitted',
        requiredFields: [
          {
            name: `${reqId}_val`,
            label: reqType === 'file' ? `${title} (Document Upload)` : title,
            type: reqType,
            description: req.example ? `Example: ${req.example}` : description,
            required: true,
          },
        ],
      };
    });

    const isGeneric = mapped.every(
      (m) =>
        m.name.toLowerCase().includes('regulatory requirement') ||
        m.requiredFields.some((f) => f.label.toLowerCase() === 'value')
    );

    if (isGeneric && requiresCompliance) {
      return fallbackRequirements;
    }

    return mapped;
  } catch (error: any) {
    console.warn('[Telnyx Regulatory Requirements Error]', error.message);
    return requiresCompliance ? fallbackRequirements : [];
  }
}

export async function createTelnyxAddress(addressData: {
  first_name?: string;
  last_name?: string;
  business_name?: string;
  street_address: string;
  extended_address?: string;
  locality: string;
  administrative_area?: string;
  postal_code: string;
  country_code: string;
}): Promise<string> {
  if (!isTelnyxConfigured()) {
    return `addr_mock_${Math.random().toString(36).substring(2, 9)}`;
  }

  try {
    const res = await getTelnyxClient().post('/addresses', addressData);
    return res.data?.data?.id || `addr_${Date.now()}`;
  } catch (err: any) {
    console.error('[Telnyx Create Address Error]', err.response?.data || err.message);
    throw new Error(`Failed to create address: ${err.response?.data?.errors?.[0]?.detail || err.message}`);
  }
}

export async function triggerExternalRequirementAction(
  requirementId: string,
  subOrderId?: string
): Promise<{ redirectUrl: string }> {
  if (!isTelnyxConfigured()) {
    return { redirectUrl: 'https://verify.onfido.com/mock-demo' };
  }

  try {
    const path = subOrderId 
      ? `/external_requirements/${requirementId}/sub_number_orders/${subOrderId}`
      : `/external_requirements/${requirementId}`;

    const res = await getTelnyxClient().post(path, {});
    const url = res.data?.data?.requirement_action?.value || res.data?.data?.url || 'https://telnyx.com';
    return { redirectUrl: url };
  } catch (err: any) {
    console.error('[Telnyx External Requirement Action Error]', err.response?.data || err.message);
    throw new Error(`Failed to trigger external action: ${err.response?.data?.errors?.[0]?.detail || err.message}`);
  }
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; id: string; status: OrderStatus }> {
  if (!isTelnyxConfigured()) {
    const order = mockOrders.find((o) => o.id === orderId);
    if (order) {
      order.status = 'cancelled';
    }
    return { success: true, id: orderId, status: 'cancelled' };
  }

  try {
    try {
      await getTelnyxClient().post(`/number_orders/${orderId}/actions/cancel`);
    } catch (e: any) {
      await getTelnyxClient().post(`/sub_number_orders/${orderId}/actions/cancel`).catch(() => {});
    }

    return { success: true, id: orderId, status: 'cancelled' };
  } catch (error: any) {
    console.error('[Telnyx Cancel Order Error]', error.response?.data || error.message);
    throw new Error(`Failed to cancel order: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
  }
}
