<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <div class="left-section">
          <router-link to="/videoLibrary" class="title-link">
            <h1>Mirror Motion</h1>
          </router-link>

          <div class="nav-buttons">
            <router-link to="/uploadVideo" class="nav-btn" :class="{ active: $route.path === '/uploadVideo' }">
              Upload Video
            </router-link>
            <router-link to="/videoLibrary" class="nav-btn" :class="{ active: $route.path === '/videoLibrary' }">
              Video Library
            </router-link>
          </div>
        </div>

        <div class="right-section">
          <router-link v-if="!isLoggedIn" to="/login" class="nav-btn">
            Login
          </router-link>
          <button v-else @click="handleLogout" class="nav-btn">
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      isLoggedIn: false
    };
  },
  created() {
    // Check if user is logged in
    this.isLoggedIn = !!localStorage.getItem('userId');
  },
  methods: {
    handleLogout() {
      localStorage.removeItem('userId');
      this.isLoggedIn = false;
      this.$router.push('/login');
    }
  },
  watch: {
    '$route': {
      handler() {
        this.isLoggedIn = !!localStorage.getItem('userId');
      },
      immediate: true
    }
  }
};
</script>

<style scoped>
/* Main container */
#app {
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  /* stack header + main */
  min-height: 100vh;
  max-height: 100vh;
  margin: 0;
  padding: 0;
}

/* reset default margins on html/body so no white gap around app */
:root,
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Header styling */
.app-header {
  background-color: #aed3e4;
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: left;
  /* justify-content: space-between; */
  /* title left, buttons right */
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.app-header div {
  display: flex;
  flex-direction: rows;
  justify-content: center;
  gap: 12px;
  align-items: center;
}

/* Header title */
.app-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.title-link {
  text-decoration: none;
  color: white;
  transition: opacity 0.2s ease;
}

.title-link:hover {
  opacity: 0.9;
}

/* Update header title style */
.app-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  cursor: pointer;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.right-section {
  margin-left: auto;
}

.nav-btn {
  padding: 8px 16px;
  border-radius: 8px;
  color: white;
  font-size: 15px;
  font-weight: bold;
  text-decoration: none;
  transition: background 0.2s ease;
  border: none;
  cursor: pointer;
  background: transparent;
}

.nav-btn.active {
  background: #7dc7e9;
  color: white;
}

.nav-btn:hover:not(.active) {
  background: #7dc7e9;
}

/* Main content area */
.app-main {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  padding: 24px;
  background: white;
  overflow: auto;
}

/* Content cards inside main */
.app-main>* {
  background: white;
  border-radius: 16px;
  padding: 24px;
}
</style>
