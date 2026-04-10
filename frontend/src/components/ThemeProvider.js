import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const ThemeProvider = ({ children }) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem={false}
    disableTransitionOnChange
  >
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
