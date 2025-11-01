<template>
  <div id="app">
    <!-- Header with title and navigation buttons -->
    <header class="app-header">
      <div>
        <router-link to="/videoLibrary" class="title-link">
          <h1>Mirror Motion</h1>
        </router-link>

        <div class="nav-buttons">
          <router-link to="/uploadVideo" class="nav-btn" :class="{ active: $route.path === '/uploadVideo' }">Upload
            Video</router-link>
          <router-link to="/videoLibrary" class="nav-btn" :class="{ active: $route.path === '/videoLibrary' }">Video
            Library</router-link>
        </div>
      </div>

    </header>

    <!-- Main content -->
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style scoped>
/* Main container */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
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

/* Navigation buttons */
.nav-buttons {
  display: flex;
  gap: 12px;
}

.nav-btn {
  padding: 8px 16px;
  border-radius: 8px;
  /* background: ; */
  color: white;
  font-size: 15px;
  font-weight: bold;
  text-decoration: none;
  transition: background 0.2s ease;
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
