// pages/_document.js

import { Html, Head, Main, NextScript } from 'next/document';
import en from '../locales/en';

export default function Document() {
  return (
    <Html lang={en.lang || 'en'}>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}