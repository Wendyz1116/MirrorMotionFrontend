import { createRouter, createWebHistory } from 'vue-router';
import UploadVideo from '../pages/UploadVideo.vue';
import VideoLibrary from '../pages/VideoLibrary.vue';
import PracticeLibrary from '@/pages/PracticeLibrary.vue';

const routes = [
  {
    path: '/',
    redirect: '/uploadVideo', // default route
  },
  {
    path: '/uploadVideo',
    name: 'UploadVideo',
    component: UploadVideo,
  },
  {
    path: '/videoLibrary',
    name: 'VideoLibrary',
    component: VideoLibrary,
  },
  {
    path: '/practice-library',
    name: 'PracticeLibrary',
    component: PracticeLibrary,
    // we will read the reference video from sessionStorage / query inside the component
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
