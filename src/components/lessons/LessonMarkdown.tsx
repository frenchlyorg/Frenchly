'use client'

/**
 * LessonMarkdown — renders sub-component markdown content (explainers).
 *
 * Uses react-markdown + remark-gfm (GFM tables/lists). All elements are styled
 * with DESIGN.md tokens only — no ad-hoc hex, no green (tertiary is reserved for
 * correct-answer feedback). Body copy is Be Vietnam Pro (font-body), headings
 * Literata (font-heading), per UI-SPEC §Typography (explainer content = body-md).
 */

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const components: Components = {
  h1: ({ children }) => (
    <h2 className="font-heading text-[22px] font-semibold leading-8 text-on-surface mt-5 mb-2">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="font-heading text-[20px] font-semibold leading-7 text-on-surface mt-5 mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-heading text-[18px] font-medium leading-6 text-on-surface mt-4 mb-1">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="font-body text-[16px] leading-7 text-on-surface-variant my-2">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-2 space-y-1 font-body text-[16px] leading-7 text-on-surface-variant">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-2 space-y-1 font-body text-[16px] leading-7 text-on-surface-variant">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} className="text-primary underline hover:no-underline">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="font-label text-[14px] bg-surface-container-high rounded px-1 py-0.5 text-on-surface">
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-outline-variant px-3 py-2 font-label text-[13px] text-on-surface bg-surface-container-high">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-outline-variant px-3 py-2 font-body text-[15px] text-on-surface-variant">
      {children}
    </td>
  ),
}

export default function LessonMarkdown({ markdown }: { markdown: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {markdown}
    </Markdown>
  )
}
