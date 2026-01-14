import sharedConfig from '@tsc/config/tailwind';

export default {
  ...sharedConfig,
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../../packages/ui/src/**/*.{js,jsx}',
  ],
};
