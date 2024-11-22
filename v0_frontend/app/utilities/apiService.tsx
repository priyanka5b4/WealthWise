import axios from "axios";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

class ApiService {
  // GET request
  static async get(endpoint, params = {}) {
    try {
      const response = await apiClient.get(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // POST request
  static async post(endpoint, data = {}, config = {}) {
    try {
      const response = await apiClient.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // PUT request
  static async put(endpoint, data = {}) {
    try {
      const response = await apiClient.put(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // PATCH request
  static async patch(endpoint, data = {}) {
    try {
      const response = await apiClient.patch(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // DELETE request
  static async delete(endpoint) {
    try {
      const response = await apiClient.delete(endpoint);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Upload file
  static async uploadFile(endpoint, file, onUploadProgress = null) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: onUploadProgress,
      };

      const response = await apiClient.post(endpoint, formData, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Download file
  static async downloadFile(endpoint, filename) {
    try {
      const response = await apiClient.get(endpoint, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Cancel request
  static cancelRequest(message = "Request cancelled") {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    return {
      cancelToken: source.token,
      cancelRequest: () => source.cancel(message),
    };
  }

  // Error handler
  static handleError(error) {
    if (error.response) {
      // Server responded with error
      console.error("Response error:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      // Request made but no response
      console.error("Request error:", error.request);
    } else {
      // Error in request setup
      console.error("Error:", error.message);
    }
  }
}

export default ApiService;
