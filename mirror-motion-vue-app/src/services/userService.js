const API_URL = "http://localhost:8000/api";

export const userService = {
  async login(username, password) {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/User/login`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }
    return data;
  },

  async register(username, password) {
    console.log(username, password);
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/User/register`, {
      method: "POST",

      body: formData,
    });

    console.log("register response:", response);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }
    return data;
  },
};
