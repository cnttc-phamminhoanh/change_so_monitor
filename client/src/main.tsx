import React from 'react';
import { createRoot } from 'react-dom/client';

import SoMonitorPage from './SoMonitorPage';

const container = document.getElementById('root');
if (!container) throw new Error('#root element is missing');

createRoot(container).render(
  <React.StrictMode>
    <SoMonitorPage />
  </React.StrictMode>,
);
