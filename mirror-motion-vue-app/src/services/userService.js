const API_URL = "http://localhost:8000/api";

export const userService = {
  async login(username, password) {
    const payload = { username, password };

    const response = await fetch(`${API_URL}/User/login`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  },

  async register(username, password) {
    const payload = { username, password };

    const response = await fetch(`${API_URL}/User/register`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  },

  async logout(session) {
    const payload = { session };

    console.log("Logging out with session:", session, `${API_URL}/logout`);
    const response = await fetch(`${API_URL}/logout`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  },
};
