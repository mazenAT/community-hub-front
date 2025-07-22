// import Echo from 'laravel-echo';
// import Pusher from 'pusher-js';

// // @ts-ignore
// window.Pusher = Pusher;

// const echo = new Echo({
//   broadcaster: 'pusher',
//   key: import.meta.env.VITE_PUSHER_APP_KEY,
//   cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
//   wsHost: import.meta.env.VITE_PUSHER_HOST || `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
//   wsPort: import.meta.env.VITE_PUSHER_PORT || 80,
//   wssPort: import.meta.env.VITE_PUSHER_PORT || 443,
//   forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || 'https') === 'https',
//   encrypted: true,
//   disableStats: true,
//   enabledTransports: ['ws', 'wss'],
//   authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT || '/broadcasting/auth',
//   auth: {
//     headers: {
//       // If using Sanctum, you may need to send XSRF-TOKEN
//       // 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
//     },
//   },
// });

const echo = {};

export default echo; 