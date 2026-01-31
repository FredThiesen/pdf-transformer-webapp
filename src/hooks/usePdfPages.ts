import { useState } from "react"
import { getDocument } from "pdfjs-dist"
import { jsPDF } from "jspdf"

export interface PageData {
	imgDataUrl: string
	width: number
	height: number
}

export function usePdfPages() {
	const [pages, setPages] = useState<PageData[]>([])
	const [loading, setLoading] = useState(false)
	const [progress, setProgress] = useState<{ current: number; total: number }>({
		current: 0,
		total: 0,
	})
	const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null)
	const [individualPdfUrls, setIndividualPdfUrls] = useState<string[]>([])
	const [originalFileName, setOriginalFileName] = useState<string | null>(null)

	// Helper to clean up object URLs
	const cleanupObjectUrls = () => {
		if (mergedPdfUrl) {
			URL.revokeObjectURL(mergedPdfUrl)
		}
		individualPdfUrls.forEach((url) => URL.revokeObjectURL(url))
	}

	function getFittedSize(
		artW: number,
		artH: number,
		pageW: number,
		pageH: number,
		gap: number,
	) {
		const maxW = pageW
		const maxH = pageH
		const sW = maxW / artW
		const sH = maxH / artH
		const s = Math.min(1, sW, sH) // não aumenta, só reduz
		return { w: artW * s, h: artH * s }
	}

	// O parâmetro maxRows agora limita o número de linhas por página A4
	const extractPages = async (
		file: File,
		maxRows?: number,
		tileAllPagesOnA4?: boolean,
		gap: number = 2,
	) => {
		cleanupObjectUrls()
		setLoading(true)
		setProgress({ current: 0, total: 0 })
		setPages([])
		setMergedPdfUrl(null)
		setIndividualPdfUrls([])
		setOriginalFileName(file.name)

		const arrayBuffer = await file.arrayBuffer()
		const pdf = await getDocument({ data: arrayBuffer }).promise
		const numPages = pdf.numPages
		setProgress({ current: 0, total: numPages })

		const extractedPages: PageData[] = []

		for (let pageNum = 1; pageNum <= numPages; pageNum++) {
			const page = await pdf.getPage(pageNum)
			const viewport = page.getViewport({ scale: 6 })
			const canvas = document.createElement("canvas")
			const context = canvas.getContext("2d")!
			canvas.width = viewport.width
			canvas.height = viewport.height
			await page.render({ canvasContext: context, viewport }).promise
			const imgDataUrl = canvas.toDataURL("image/jpeg", 1)
			const view = page.view
			const pageWidth = view[2] - view[0]
			const pageHeight = view[3] - view[1]
			extractedPages.push({
				imgDataUrl,
				width: pageWidth,
				height: pageHeight,
			})
			setProgress({ current: pageNum, total: numPages })
		}

		setPages(extractedPages)
		generateAllPDFs(extractedPages, maxRows, tileAllPagesOnA4, gap)
		setLoading(false)
	}

	// utils/layoutHelpers.ts

	interface GridLayoutParams {
		pageWidth: number
		pageHeight: number
		artWidth: number
		artHeight: number
		gap: number
		maxRows?: number
	}

	interface Position {
		x: number
		y: number
		w: number
		h: number
	}

	function getReplicatedPositionsInA4Grid({
		pageWidth,
		pageHeight,
		artWidth,
		artHeight,
		gap,
		maxRows,
	}: GridLayoutParams): Position[] {
		// 1) ajusta tamanho da arte para caber no A4
		const fitted = getFittedSize(
			artWidth,
			artHeight,
			pageWidth,
			pageHeight,
			gap,
		)
		const tileW = fitted.w
		const tileH = fitted.h

		// 2) calcula colunas/linhas garantindo pelo menos 1 de cada
		const cols = Math.max(1, Math.floor((pageWidth + gap) / (tileW + gap)))
		const rowsAvailable = Math.max(
			1,
			Math.floor((pageHeight + gap) / (tileH + gap)),
		)
		const rows =
			maxRows !== undefined ? Math.min(maxRows, rowsAvailable) : rowsAvailable

		// 3) sem margens externas; apenas gap entre artes
		const adjustedXGap = gap
		const adjustedYGap = gap

		const positions: Position[] = []
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const x = col * (tileW + adjustedXGap)
				const y = row * (tileH + adjustedYGap)
				positions.push({ x, y, w: tileW, h: tileH })
			}
		}
		return positions
	}

	const generateAllPDFs = (
		pages: PageData[],
		maxRows?: number,
		tileAllPagesOnA4?: boolean,
		gap: number = 2,
	) => {
		cleanupObjectUrls()
		if (pages.length === 0) {
			setMergedPdfUrl(null)
			setIndividualPdfUrls([])
			return
		}

		const a4Width = 595.28
		const a4Height = 841.89

		const mergedPdf = new jsPDF({ unit: "pt", format: "a4" })

		if (tileAllPagesOnA4) {
			// Modo "1 cópia de cada arte" — agora colocando uma após a outra na mesma página
			let currentX = 0
			let currentY = 0
			let rowHeight = 0

			pages.forEach((page, idx) => {
				if (idx === 0) {
					// primeira página já existe implicitamente
				}

				const scaleWidth = a4Width / page.width
				const scaleHeight = a4Height / page.height

				const scale = Math.min(scaleWidth, scaleHeight, 1)

				const artW = page.width * scale
				const artH = page.height * scale

				// 👉 Wrap horizontal
				if (currentX + artW > a4Width) {
					currentX = 0
					currentY += rowHeight + gap
					rowHeight = 0
				}

				// 👉 Wrap vertical → nova página
				if (currentY + artH > a4Height) {
					mergedPdf.addPage()
					currentX = 0
					currentY = 0
					rowHeight = 0
				}

				// Desenha na página
				mergedPdf.addImage(
					page.imgDataUrl,
					"JPEG",
					currentX,
					currentY,
					artW,
					artH,
				)

				// Move X e registra altura máxima da linha
				currentX += artW + gap
				rowHeight = Math.max(rowHeight, artH)
			})
		} else {
			// grid replicado por página, MAS agora empilhando as artes na mesma folha
			// respeitando maxRows (máximo de linhas por arte), e só quebrando página
			// quando acaba o espaço vertical.

			let currentY = 0 // posição vertical atual na página

			pages.forEach((page) => {
				// 1) ajusta tamanho da arte para caber no A4
				const fitted = getFittedSize(
					page.width,
					page.height,
					a4Width,
					a4Height,
					gap,
				)
				const tileW = fitted.w
				const tileH = fitted.h

				// 2) calcula quantas colunas cabem
				const cols = Math.max(1, Math.floor((a4Width + gap) / (tileW + gap)))

				// 3) calcula quantas linhas cabem por página A4
				const rowsAvailablePerPage = Math.max(
					1,
					Math.floor((a4Height + gap) / (tileH + gap)),
				)

				// 4) para cada arte, respeita o maxRows como limite
				const rowsForThisArt =
					maxRows !== undefined
						? Math.min(maxRows, rowsAvailablePerPage)
						: rowsAvailablePerPage

				let rowsRemaining = rowsForThisArt

				while (rowsRemaining > 0) {
					// Se não cabe mais uma linha nessa página, cria nova página
					if (currentY + tileH > a4Height) {
						mergedPdf.addPage()
						currentY = 0
					}

					// Sem margens externas, apenas gap entre tiles
					const adjustedXGap = gap
					const y = currentY

					for (let col = 0; col < cols; col++) {
						const x = col * (tileW + adjustedXGap)
						mergedPdf.addImage(page.imgDataUrl, "JPEG", x, y, tileW, tileH)
					}

					// Avança para a próxima linha
					currentY += tileH + gap
					rowsRemaining--
				}
			})
		}

		const mergedBlob = mergedPdf.output("blob")
		const mergedUrl = URL.createObjectURL(mergedBlob)
		setMergedPdfUrl(mergedUrl)

		if (tileAllPagesOnA4) {
			setIndividualPdfUrls([])
		} else {
			// PDFs individuais (um por página de origem), também usando tamanhos ajustados
			const urls: string[] = []
			pages.forEach((page) => {
				const positions = getReplicatedPositionsInA4Grid({
					pageWidth: a4Width,
					pageHeight: a4Height,
					artWidth: page.width,
					artHeight: page.height,
					gap,
					maxRows,
				})
				const pdf = new jsPDF({ unit: "pt", format: "a4" })
				positions.forEach(({ x, y, w, h }) => {
					pdf.addImage(page.imgDataUrl, "JPEG", x, y, w, h)
				})
				const blob = pdf.output("blob")
				urls.push(URL.createObjectURL(blob))
			})
			setIndividualPdfUrls(urls)
		}
	}

	return {
		pages,
		loading,
		progress,
		extractPages,
		mergedPdfUrl,
		individualPdfUrls,
		generateAllPDFs,
		originalFileName,
	}
}
