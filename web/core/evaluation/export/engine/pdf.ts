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

/**
 * Generate a PDF from a HTML string.
 * @param html - The HTML string to generate a PDF from.
 * @param header - The header to display on the PDF.
 * @returns The PDF buffer.
 */
import puppeteer from 'puppeteer'

export async function generatePDF(html: string, header: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  page.setDefaultTimeout(1800000)

  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 1800000 })
  await page.emulateMediaType('screen')

  await page.evaluate(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @page { size: A4; }
      @page:first { @bottom-left{content:""}; @bottom-right{content:""} }
    `
    document.head.appendChild(style)
  })

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '10mm', bottom: '10mm', left: '5mm', right: '5mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:12px">${header}</div>`,
    footerTemplate: `
      <div style="font-size:10px;width:100%;color:#aaa;">
        <span class="pageNumber"></span>/<span class="totalPages"></span>
      </div>
    `,
  })

  await browser.close()
  return pdfBuffer
}
