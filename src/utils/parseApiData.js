const ARRAY_KEYS = [
  'users',
  'pendingUsers',
  'employees',
  'branches',
  'shifts',
  'attendances',
  'attendance',
  'history',
  'items',
  'records',
  'list',
  'results',
  'data',
];

const OBJECT_KEYS = [
  'employee',
  'user',
  'branch',
  'shift',
  'attendance',
  'data',
];

function unwrapPayload(response) {
  if (!response) return null;
  if (response.data !== undefined) return response.data;
  return response;
}

export function extractArray(response, keys = ARRAY_KEYS) {
  const payload = unwrapPayload(response);

  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === 'object') {
    for (const key of keys) {
      if (Array.isArray(payload[key])) {
        return payload[key];
      }
    }

    if (payload.data && typeof payload.data === 'object') {
      const nested = payload.data;
      if (Array.isArray(nested)) return nested;

      for (const key of keys) {
        if (Array.isArray(nested[key])) {
          return nested[key];
        }
      }
    }

    for (const key of OBJECT_KEYS) {
      if (payload[key]) return [payload[key]];
    }
  }

  return [];
}

export function extractObject(response, keys = OBJECT_KEYS) {
  const payload = unwrapPayload(response);

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  for (const key of keys) {
    if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload;
}

export function parseApiData(response, preferredKey) {
  const keys = preferredKey
    ? [preferredKey, ...ARRAY_KEYS.filter((k) => k !== preferredKey)]
    : ARRAY_KEYS;
  return extractArray(response, keys);
}

export function parseApiItem(response) {
  return extractObject(response, OBJECT_KEYS);
}

export function getApiMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Đã xảy ra lỗi không xác định'
  );
}
