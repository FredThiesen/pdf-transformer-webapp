import { useState } from "react"
import UploadPDF from "./components/UploadPDF"
import GeneratePDF from "./components/GeneratePDF"
import { PDFDocument } from "pdf-lib"
import "./App.css"

function App() {
	const [pdfFile, setPdfFile] = useState<File | null>(null)
	const [pdfDimensions, setPdfDimensions] = useState<{
		width: number
		height: number
	} | null>(null)
	const [generating, setGenerating] = useState(false)

	// Função para extrair a primeira página como imagem (arte) e pegar dimensões
	const extractFirstPageAsImage = async (
		file: File
	): Promise<{
		bytes: Uint8Array | null
		width: number
		height: number
	} | null> => {
		try {
			const bytes = await file.arrayBuffer()
			const srcPdf = await PDFDocument.load(bytes)
			const artPdf = await PDFDocument.create()
			const [firstPage] = await artPdf.copyPages(srcPdf, [0])
			artPdf.addPage(firstPage)
			const width = firstPage.getWidth()
			const height = firstPage.getHeight()
			const saved = await artPdf.save()
			return { bytes: saved, width, height }
		} catch (e) {
			console.error("Erro ao extrair arte do PDF:", e)
			alert("Erro ao extrair arte do PDF: " + e)
			return null
		}
	}

	// Detecta dimensões ao selecionar arquivo
	const handleFileSelected = async (file: File | null) => {
		setPdfFile(file)
		if (file) {
			const result = await extractFirstPageAsImage(file)
			if (result) {
				setPdfDimensions({ width: result.width, height: result.height })
			} else {
				setPdfDimensions(null)
			}
		} else {
			setPdfDimensions(null)
		}
	}

	// Função para gerar o novo PDF em grade
	const handleGeneratePDF = async () => {
		if (!pdfFile || !pdfDimensions) return
		setGenerating(true)
		try {
			const artResult = await extractFirstPageAsImage(pdfFile)
			if (!artResult || !artResult.bytes) {
				setGenerating(false)
				return
			}
			const { width: artWidth, height: artHeight } = pdfDimensions

			// Página A4 em pontos
			const a4Width = 595.28
			const a4Height = 841.89

			const margin = 10 // margem em pontos
			const usableWidth = a4Width - margin * 2
			const usableHeight = a4Height - margin * 2
			const cols = Math.floor((usableWidth + margin) / (artWidth + margin))
			const rows = Math.floor((usableHeight + margin) / (artHeight + margin))

			const newPdf = await PDFDocument.create()
			const artPdf = await PDFDocument.load(artResult.bytes)
			const artPage = artPdf.getPage(0)
			const embeddedPage = await newPdf.embedPage(artPage)
			const page = newPdf.addPage([a4Width, a4Height])

			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const x = margin + col * (artWidth + margin)
					// Novo cálculo: topo da arte exatamente abaixo da margem superior
					const y = a4Height - margin - artHeight - row * (artHeight + margin)
					// Se y < margin, não desenhar (evita corte na última linha)
					if (y < margin) continue
					page.drawPage(embeddedPage, {
						x,
						y,
						xScale: 1,
						yScale: 1,
					})
				}
			}

			const pdfBytes = await newPdf.save()
			const blob = new Blob([pdfBytes], { type: "application/pdf" })
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = "arte-em-grade.pdf"
			a.click()
			URL.revokeObjectURL(url)
			setGenerating(false)
		} catch (e) {
			console.error("Erro ao gerar ou baixar o PDF:", e)
			alert("Erro ao gerar ou baixar o PDF: " + e)
			setGenerating(false)
		}
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
			<h1 className="text-2xl font-bold mb-6">
				Transforma PDF - Arte em Grade
			</h1>
			<div className="w-full max-w-md bg-white rounded shadow p-6 flex flex-col gap-4">
				<UploadPDF onFileSelected={handleFileSelected} />
				{pdfDimensions && (
					<div className="text-sm text-gray-600">
						Tamanho da arte detectado: {pdfDimensions.width.toFixed(0)} x{" "}
						{pdfDimensions.height.toFixed(0)} pontos
					</div>
				)}
				<GeneratePDF
					onGenerate={handleGeneratePDF}
					disabled={!pdfFile || generating}
				/>
			</div>
			<p className="mt-8 text-xs text-gray-400">
				Tudo é processado no navegador. Nenhum arquivo é enviado para
				servidores.
			</p>
		</div>
	)
}

export default App
