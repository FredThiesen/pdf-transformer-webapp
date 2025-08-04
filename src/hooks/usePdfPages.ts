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

	// Helper to clean up object URLs
	const cleanupObjectUrls = () => {
		if (mergedPdfUrl) {
			URL.revokeObjectURL(mergedPdfUrl)
		}
		individualPdfUrls.forEach((url) => URL.revokeObjectURL(url))
	}

	// O parâmetro maxRows agora limita o número de linhas por página A4
	const extractPages = async (file: File, maxRows?: number) => {
		cleanupObjectUrls()
		setLoading(true)
		setProgress({ current: 0, total: 0 })
		setPages([])
		setMergedPdfUrl(null)
		setIndividualPdfUrls([])

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
		generateAllPDFs(extractedPages, maxRows)
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
	}

	function getReplicatedPositionsInA4Grid({
		pageWidth,
		pageHeight,
		artWidth,
		artHeight,
		gap,
		maxRows,
	}: GridLayoutParams): Position[] {
		const cols = Math.floor((pageWidth + gap) / (artWidth + gap))
		const rowsAvailable = Math.floor((pageHeight + gap) / (artHeight + gap))
		const rows =
			maxRows !== undefined ? Math.min(maxRows, rowsAvailable) : rowsAvailable

		// Centraliza horizontalmente, mas alinha no topo verticalmente
		const adjustedXGap = (pageWidth - cols * artWidth) / (cols + 1)
		const adjustedYGap = gap // fixo para alinhar no topo

		const positions: Position[] = []

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const x = adjustedXGap + col * (artWidth + adjustedXGap)
				const y = adjustedYGap + row * (artHeight + adjustedYGap)
				positions.push({ x, y })
			}
		}

		return positions
	}

	const generateAllPDFs = (pages: PageData[], maxRows?: number) => {
		cleanupObjectUrls()
		if (pages.length === 0) {
			setMergedPdfUrl(null)
			setIndividualPdfUrls([])
			return
		}

		const a4Width = 595.28
		const a4Height = 841.89
		const gap = 10

		const mergedPdf = new jsPDF({ unit: "pt", format: "a4" })

		pages.forEach((page, index) => {
			if (index > 0) mergedPdf.addPage()

			const positions = getReplicatedPositionsInA4Grid({
				pageWidth: a4Width,
				pageHeight: a4Height,
				artWidth: page.width,
				artHeight: page.height,
				gap,
				maxRows,
			})

			positions.forEach(({ x, y }) => {
				mergedPdf.addImage(
					page.imgDataUrl,
					"JPEG",
					x,
					y,
					page.width,
					page.height
				)
			})
		})

		const mergedBlob = mergedPdf.output("blob")
		const mergedUrl = URL.createObjectURL(mergedBlob)
		setMergedPdfUrl(mergedUrl)

		// Individual PDFs
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
			positions.forEach(({ x, y }) => {
				pdf.addImage(page.imgDataUrl, "JPEG", x, y, page.width, page.height)
			})

			const blob = pdf.output("blob")
			const url = URL.createObjectURL(blob)
			urls.push(url)
		})

		setIndividualPdfUrls(urls)
	}

	return {
		pages,
		loading,
		progress,
		extractPages,
		mergedPdfUrl,
		individualPdfUrls,
		generateAllPDFs,
	}
}
