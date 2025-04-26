import { useEffect, useState } from "react"
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
	const [artworkBytes, setArtworkBytes] = useState<Uint8Array | null>(null)
	const [generating, setGenerating] = useState(false)
	const [outputPdfUrl, setOutputPdfUrl] = useState<string | null>(null)
	const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null)

	useEffect(() => {
		if (pdfFile && !generating) {
			console.log("gerando pdf automaticamente")
			handleGeneratePDF()
		}
	}, [artworkBytes, pdfDimensions, pdfFile, generating])

	// ✅ Função corrigida para extrair dimensões sem recriar o PDF
	const extractFirstPageAsImage = async (file: File) => {
		try {
			const bytes = await file.arrayBuffer()
			const srcPdf = await PDFDocument.load(bytes)
			const firstPage = srcPdf.getPage(0)
			const width = firstPage.getWidth()
			const height = firstPage.getHeight()

			return { bytes: new Uint8Array(bytes), width, height }
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
				setArtworkBytes(result.bytes)
				setPdfDimensions({ width: result.width, height: result.height })
				// Cria URL para preview do PDF original
				const url = URL.createObjectURL(file)
				setOriginalPdfUrl(url)
			} else {
				setArtworkBytes(null)
				setPdfDimensions(null)
				setOriginalPdfUrl(null)
			}
		} else {
			setArtworkBytes(null)
			setPdfDimensions(null)
			setOriginalPdfUrl(null)
		}
	}

	// Função para gerar o novo PDF em grade
	const handleGeneratePDF = async () => {
		if (!artworkBytes || !pdfDimensions) return
		setGenerating(true)
		try {
			const { width: artWidth, height: artHeight } = pdfDimensions

			// Página A4 em pontos
			const a4Width = 595.28
			const a4Height = 841.89

			const margin = 10
			const paddingY = 10 // espaço em pontos acima e abaixo da arte
			const paddedArtHeight = artHeight + paddingY * 2
			const usableWidth = a4Width - margin * 2
			const usableHeight = a4Height - margin * 2
			const cols = Math.floor((usableWidth + margin) / (artWidth + margin))
			const rows = Math.floor(
				(usableHeight + margin) / (paddedArtHeight + margin)
			)

			const newPdf = await PDFDocument.create()
			const artPdf = await PDFDocument.load(artworkBytes)
			const artPage = artPdf.getPage(0)
			const embeddedPage = await newPdf.embedPage(artPage)
			const page = newPdf.addPage([a4Width, a4Height])

			const startY = a4Height - margin - paddedArtHeight

			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const x = margin + col * (artWidth + margin)
					const y = startY - row * (paddedArtHeight + margin) + paddingY
					if (y < margin) continue
					// Desenha a imagem
					page.drawPage(embeddedPage, {
						x,
						y,
						xScale: 1,
						yScale: 1,
						boundingBox: {
							left: 0,
							bottom: 0,
							right: artWidth,
							top: artHeight,
						},
					})
				}
			}

			const pdfBytes = await newPdf.save()
			const blob = new Blob([pdfBytes], { type: "application/pdf" })
			const url = URL.createObjectURL(blob)
			console.log("PDF gerado com sucesso:", url)
			setOutputPdfUrl(url)
		} catch (e) {
			console.error("Erro ao gerar ou baixar o PDF:", e)
			alert("Erro ao gerar ou baixar o PDF: " + e)
		} finally {
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
				{originalPdfUrl && pdfDimensions && (
					<div className="mt-4">
						<div className="text-xs text-gray-500 mb-1">
							Pré-visualização do PDF original:
						</div>
						<iframe
							title="Pré-visualização do PDF original"
							src={originalPdfUrl}
							style={{
								width: "100%",
								height: `${pdfDimensions.height * 1.33 + 40}px`, // 1pt ≈ 1.33px + margem extra
								border: "1px solid #ccc",
								borderRadius: "8px",
							}}
						/>
					</div>
				)}
				<GeneratePDF
					onGenerate={handleGeneratePDF}
					disabled={!pdfFile || generating}
				/>
				{outputPdfUrl && pdfDimensions && (
					<div className="mt-4">
						<div className="text-xs text-gray-500 mb-1">
							Pré-visualização do PDF gerado:
						</div>
						<iframe
							title="Pré-visualização do PDF"
							src={outputPdfUrl}
							style={{
								width: "100%",
								height: `${pdfDimensions.height * 1.33 + 40}px`,
								border: "1px solid #ccc",
								borderRadius: "8px",
							}}
						/>
					</div>
				)}
			</div>
			<p className="mt-8 text-xs text-gray-400">
				Tudo é processado no navegador. Nenhum arquivo é enviado para
				servidores.
			</p>
		</div>
	)
}

export default App
