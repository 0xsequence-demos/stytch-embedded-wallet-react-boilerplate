import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { StytchProvider } from "@stytch/react";
import { StytchUIClient } from "@stytch/vanilla-js";

const stytch = new StytchUIClient(import.meta.env.VITE_STYTCH_PUBLIC_TOKEN);

createRoot(document.getElementById('root')!).render(
    <StytchProvider stytch={stytch}>
      <App />
    </StytchProvider>
)
