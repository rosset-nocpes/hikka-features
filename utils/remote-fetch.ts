export interface RemoteFetchRequest {
  type: 'remote-fetch';
  url: string;
  method: 'GET' | 'POST';
  body?: string;
}

export interface RemoteFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  body: string;
}

export const remoteFetchText = async (
  url: string,
  method: RemoteFetchRequest['method'] = 'GET',
  body?: string,
) => {
  const response: unknown = await browser.runtime.sendMessage({
    type: 'remote-fetch',
    url,
    method,
    body,
  } satisfies RemoteFetchRequest);

  if (!isRemoteFetchResponse(response)) {
    throw new Error('Remote fetch returned an invalid response');
  }
  if (!response.ok) {
    throw new Error(
      `Remote fetch failed with ${response.status} ${response.statusText}`,
    );
  }

  return response.body;
};

const isRemoteFetchResponse = (
  response: unknown,
): response is RemoteFetchResponse =>
  !!response &&
  typeof response === 'object' &&
  'ok' in response &&
  typeof response.ok === 'boolean' &&
  'status' in response &&
  typeof response.status === 'number' &&
  'statusText' in response &&
  typeof response.statusText === 'string' &&
  'body' in response &&
  typeof response.body === 'string';
