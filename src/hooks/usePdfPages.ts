import { useState } from "react"
import { getDocument } from "pdfjs-dist"
import { jsPDF } from "jspdf"
import { computeGridLayout, getFittedSize } from "../utils/artUtils"

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


	// O parâmetro maxRows agora limita o número de linhas por página A4
	const extractPages = async (
		file: File,
		maxRows?: number,
		tileAllPagesOnA4?: boolean,
		gap: number = 2,
		outerMarginXPt?: number,
		outerMarginYPt?: number,
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
		generateAllPDFs(
			extractedPages,
			maxRows,
			tileAllPagesOnA4,
			gap,
			outerMarginXPt,
			outerMarginYPt,
		)
		setLoading(false)
	}

	// utils/layoutHelpers.ts

	interface GridLayoutParams {
		pageWidth: number
		pageHeight: number
		artWidth: number
		artHeight: number
		gap: number
		outerMarginXPt?: number
		outerMarginYPt?: number
		maxRows?: number
	}

interface Position {
	x: number
	y: number
	w: number
	h: number
}

const getUsableArea = (
	pageW: number,
	pageH: number,
	outerMarginX: number,
	outerMarginY: number,
) => {
	const safeOuterMarginX = Math.max(0, outerMarginX)
	const safeOuterMarginY = Math.max(0, outerMarginY)
	return {
		outerMarginX: safeOuterMarginX,
		outerMarginY: safeOuterMarginY,
		usableW: Math.max(1, pageW - safeOuterMarginX * 2),
		usableH: Math.max(1, pageH - safeOuterMarginY * 2),
	}
}

	function getReplicatedPositionsInA4Grid({
		pageWidth,
		pageHeight,
		artWidth,
		artHeight,
		gap,
		outerMarginXPt,
		outerMarginYPt,
		maxRows,
	}: GridLayoutParams): Position[] {
		const effectiveOuterMarginX = outerMarginXPt ?? 0
		const effectiveOuterMarginY = outerMarginYPt ?? 0
		const { outerMarginX, outerMarginY, usableW, usableH } = getUsableArea(
			pageWidth,
			pageHeight,
			effectiveOuterMarginX,
			effectiveOuterMarginY,
		)

		// 1) ajusta tamanho da arte para caber no A4
		const fitted = getFittedSize(
			artWidth,
			artHeight,
			usableW,
			usableH,
			gap,
		)
		const grid = computeGridLayout({
			tileW: fitted.w,
			tileH: fitted.h,
			pageW: usableW,
			pageH: usableH,
			gap,
			epsilon: 10,
		})
		const tileW = grid.tileW
		const tileH = grid.tileH
		const cols = grid.cols
		const rowsAvailable = grid.rowsAvailable
		const rows =
			maxRows !== undefined ? Math.min(maxRows, rowsAvailable) : rowsAvailable

		// 3) sem margens externas; apenas gap entre artes
		const adjustedXGap = gap
		const adjustedYGap = gap

		const positions: Position[] = []
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const x = outerMarginX + col * (tileW + adjustedXGap)
				const y = outerMarginY + row * (tileH + adjustedYGap)
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
		outerMarginXPt?: number,
		outerMarginYPt?: number,
	) => {
		cleanupObjectUrls()
		if (pages.length === 0) {
			setMergedPdfUrl(null)
			setIndividualPdfUrls([])
			return
		}

		const a4Width = 595.28
		const a4Height = 841.89
		const effectiveOuterMarginX = outerMarginXPt ?? 0
		const effectiveOuterMarginY = outerMarginYPt ?? 0
		const { outerMarginX, outerMarginY, usableW, usableH } = getUsableArea(
			a4Width,
			a4Height,
			effectiveOuterMarginX,
			effectiveOuterMarginY,
		)
		console.log(
			`[layout] generateAllPDFs pages=${pages.length} maxRows=${maxRows ?? "undefined"} tileAllPagesOnA4=${tileAllPagesOnA4} gap=${gap} outerMarginX=${effectiveOuterMarginX} outerMarginY=${effectiveOuterMarginY} a4Width=${a4Width} a4Height=${a4Height}`,
		)

		const mergedPdf = new jsPDF({ unit: "pt", format: "a4" })

		if (tileAllPagesOnA4) {
			// Modo "1 cópia de cada arte" — agora colocando uma após a outra na mesma página
			let currentX = outerMarginX
			let currentY = outerMarginY
			let rowHeight = 0

			pages.forEach((page, idx) => {
				if (idx === 0) {
					// primeira página já existe implicitamente
				}

				const scaleWidth = usableW / page.width
				const scaleHeight = usableH / page.height

				const scale = Math.min(scaleWidth, scaleHeight, 1)

				const artW = page.width * scale
				const artH = page.height * scale
				console.log(
					`[layout] tileAllPagesOnA4 item pageIndex=${idx + 1} artW=${artW} artH=${artH} scale=${scale} scaleWidth=${scaleWidth} scaleHeight=${scaleHeight} currentX=${currentX} currentY=${currentY}`,
				)

				// 👉 Wrap horizontal
				if (currentX + artW > a4Width - outerMarginX) {
					currentX = outerMarginX
					currentY += rowHeight + gap
					rowHeight = 0
				}

				// 👉 Wrap vertical → nova página
				if (currentY + artH > a4Height - outerMarginY) {
					mergedPdf.addPage()
					currentX = outerMarginX
					currentY = outerMarginY
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

			let currentY = outerMarginY // posição vertical atual na página

			pages.forEach((page) => {
				// 1) ajusta tamanho da arte para caber no A4
				const fitted = getFittedSize(
					page.width,
					page.height,
					usableW,
					usableH,
					gap,
				)
				const grid = computeGridLayout({
					tileW: fitted.w,
					tileH: fitted.h,
					pageW: usableW,
					pageH: usableH,
					gap,
					epsilon: 10,
				})
				const tileW = grid.tileW
				const tileH = grid.tileH
				const cols = grid.cols
				const rowsAvailablePerPage = grid.rowsAvailable
				console.log(
					`[layout] grid calc tileW=${tileW} tileH=${tileH} cols=${cols} rowsAvailablePerPage=${rowsAvailablePerPage} maxRows=${maxRows ?? "undefined"} gap=${gap}`,
				)

				// 4) para cada arte, respeita o maxRows como limite
				const rowsForThisArt =
					maxRows !== undefined
						? Math.min(maxRows, rowsAvailablePerPage)
						: rowsAvailablePerPage

				let rowsRemaining = rowsForThisArt

				while (rowsRemaining > 0) {
					// Se não cabe mais uma linha nessa página, cria nova página
					if (currentY + tileH > a4Height - outerMarginY) {
						mergedPdf.addPage()
						currentY = outerMarginY
					}

					// Sem margens externas, apenas gap entre tiles
					const adjustedXGap = gap
					const y = currentY

					for (let col = 0; col < cols; col++) {
						const x = outerMarginX + col * (tileW + adjustedXGap)
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
						outerMarginXPt: effectiveOuterMarginX,
						outerMarginYPt: effectiveOuterMarginY,
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
