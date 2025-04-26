import React from "react"
import { PageData } from "../hooks/usePdfPages"

interface PdfActionsProps {
	pages: PageData[]
	mergedPdfUrl: string | null
	individualPdfUrls: string[]
	onGenerateMerged: () => void
	onGenerateIndividual: () => void
}

const PdfActions: React.FC<PdfActionsProps> = ({
	pages,
	mergedPdfUrl,
	individualPdfUrls,
}) => {
	if (pages.length === 0) return null

	const handleDownloadMergedPdf = () => {
		if (!mergedPdfUrl) return
		const link = document.createElement("a")
		link.href = mergedPdfUrl
		link.download = "todas-as-paginas.pdf"
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const handleDownloadIndividualPdf = (url: string, index: number) => {
		if (!url) return
		const link = document.createElement("a")
		link.href = url
		link.download = `pagina-${index + 1}-pronta-para-impressao.pdf`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const renderPage = (page: PageData, index: number) => {
		return (
			<div
				key={index}
				className="bg-primary rounded-lg shadow-md border border-white p-4 flex flex-col items-center mb-6 max-w-sm mx-auto"
			>
				<div className="font-semibold text-lg mb-2 text-white">
					Página {index + 1}
				</div>
				<img
					src={page.imgDataUrl}
					alt={`Página ${index + 1}`}
					className="w-full h-48 object-contain rounded-lg mb-4"
				/>
				{individualPdfUrls[index] && (
					<button
						onClick={() =>
							handleDownloadIndividualPdf(individualPdfUrls[index], index)
						}
						className="bg-primary text-white border-2 border-tertiary rounded px-4 py-2 font-medium hover:bg-tertiary hover:text-primary transition"
					>
						Baixar somente esta Página
					</button>
				)}
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{mergedPdfUrl && (
				<div className="flex justify-center mb-6">
					<button
						onClick={handleDownloadMergedPdf}
						className="bg-tertiary text-primary border-2 border-tertiary rounded-lg px-6 py-2 font-semibold shadow hover:bg-primary/90 hover:text-white transition"
					>
						Baixar PDF com todas as páginas
					</button>
				</div>
			)}
			<h3 className="text-xl font-bold text-center mb-4 text-white">
				Arquivo carregado:
			</h3>
			<div className="flex flex-col gap-6">{pages.map(renderPage)}</div>
		</div>
	)
}

export default PdfActions
