// 简单的App组件，只用于满足Next.js要求
import { AppProps } from 'next/app';

// 加载环境变量
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
