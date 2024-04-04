let API_URL = "TODO";

API_URL = "/api";

if (window.API_URL) API_URL = window.API_URL;

export class HTTPError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const apiRequest = async (method, path, body = null) => {
  try {
    const response = await fetch(API_URL + path, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      const errorData = await response.json();
      window.alert(errorData.message);
      throw new HTTPError(response.status, errorData.error);
    }

    return await response.json();
  } catch (error) {
    throw new HTTPError(500, "Internal Server Error");
  }
};

export default apiRequest;
