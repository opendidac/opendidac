/**
 * Copyright 2022-2024 HEIG-VD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect, useRef } from 'react';
import * as Viz from '@viz-js/viz';
import { Box } from '@mui/material';

import ErrorBoundary from '@/components/layout/utils/ErrorBoundary';

const GraphvizBloc = ({ code }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const el = containerRef.current;
      if (!el) return;
      el.innerHTML = '';
      if (!code) return;

      const viz = await Viz.instance();
      const svg = viz.renderSVGElement(code, { yInvert: false, fit: true });
      if (!cancelled) el.appendChild(svg);
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <ErrorBoundary>
      <Box
        ref={containerRef}
        sx={{ width: '100%', height: '100%', overflow: 'auto', lineHeight: 0, display: 'block' }}
        aria-label="Graphviz diagram"
        role="img"
      />
    </ErrorBoundary>
  );
};

export default GraphvizBloc;
