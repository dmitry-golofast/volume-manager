import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css';

import App from './App.vue';
import { i18n, primeVueLocale } from './i18n';
import './style.css';

createApp(App)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: '.app-dark',
      },
    },
    locale: primeVueLocale,
  })
  .use(ToastService)
  .use(i18n)
  .mount('#app');
