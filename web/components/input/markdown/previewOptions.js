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
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { getCodeString } from 'rehype-rewrite'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import CodeBlock from './CodeBlock' // Use existing component for handling code blocks
import MermaidBloc from './MermaidBloc' // Use existing component for handling Mermaid diagrams
import GraphvizBloc from './GraphvizBloc'

const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes.code || []), 'className'],
  },
}

export const previewOptions = {
  rehypePlugins: [[rehypeSanitize, { schema: customSchema }]],
  components: {
    code: ({ children = [], className, node, ...props }) => {
      const position = node?.position || {}
      const inline =
        !position.start.line || position.start.line === position.end.line
      const language =
        className?.split(' ')[0].replace('language-', '')?.toLowerCase() ||
        'javascript'

      if (inline) {
        const txt = children
        if (typeof txt === 'string' && /^\$\$(.*)\$\$/.test(txt)) {
          const html = katex.renderToString(
            txt.replace(/^\$\$(.*)\$\$/, '$1'),
            {
              throwOnError: false,
            },
          )
          return <code dangerouslySetInnerHTML={{ __html: html }} />
        }
        return <code>{txt}</code> // Inline code
      } else {
        const txt = children[0]
        const code = node && node.children ? getCodeString(node.children) : txt
        if (['latex', 'katex'].includes(language)) {
          const html = katex.renderToString(code, {
            throwOnError: false,
          })
          return <code dangerouslySetInnerHTML={{ __html: html }} />
        } else if (language === 'mermaid') {
          return <MermaidBloc code={code} />
        } else if (language === 'graphviz') {
          return <GraphvizBloc code={code} />
        } else {
          return <CodeBlock language={language} value={code} />
        }
      }
    },
  },
}
