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

	const extractPages = async (file: File) => {
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
			const viewport = page.getViewport({ scale: 10 })
			const canvas = document.createElement("canvas")
			const context = canvas.getContext("2d")!
			canvas.width = viewport.width
			canvas.height = viewport.height
			await page.render({ canvasContext: context, viewport }).promise
			const imgDataUrl = canvas.toDataURL("image/png")
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
		generateAllPDFs(extractedPages)
		setLoading(false)
	}

	const generateAllPDFs = (pages: PageData[]) => {
		// Generate merged PDF
		if (pages.length === 0) {
			setMergedPdfUrl(null)
			setIndividualPdfUrls([])
			return
		}
		const a4Width = 595.28
		const a4Height = 841.89
		const gap = 10
		// Merged PDF
		const mergedPdf = new jsPDF({ unit: "pt", format: "a4" })
		pages.forEach((page, index) => {
			if (index > 0) mergedPdf.addPage()
			const { imgDataUrl, width, height } = page
			const cols = Math.floor((a4Width + gap) / (width + gap))
			const rows = Math.floor((a4Height + gap) / (height + gap))
			const adjustedXGap = (a4Width - cols * width) / (cols + 1)
			const adjustedYGap = (a4Height - rows * height) / (rows + 1)
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const x = adjustedXGap + col * (width + adjustedXGap)
					const y = adjustedYGap + row * (height + adjustedYGap)
					mergedPdf.addImage(imgDataUrl, "PNG", x, y, width, height)
				}
			}
		})
		const mergedBlob = mergedPdf.output("blob")
		const mergedUrl = URL.createObjectURL(mergedBlob)
		setMergedPdfUrl(mergedUrl)
		// Individual PDFs
		const urls: string[] = []
		pages.forEach((page) => {
			const { imgDataUrl, width, height } = page
			const cols = Math.floor((a4Width + gap) / (width + gap))
			const rows = Math.floor((a4Height + gap) / (height + gap))
			const adjustedXGap = (a4Width - cols * width) / (cols + 1)
			const adjustedYGap = (a4Height - rows * height) / (rows + 1)
			const pdf = new jsPDF({ unit: "pt", format: "a4" })
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const x = adjustedXGap + col * (width + adjustedXGap)
					const y = adjustedYGap + row * (height + adjustedYGap)
					pdf.addImage(imgDataUrl, "PNG", x, y, width, height)
				}
			}
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
	}
}
