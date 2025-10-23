import React, { useState } from "react"
import { PageData } from "../hooks/usePdfPages"

interface PdfActionsProps {
	pages: PageData[]
	mergedPdfUrl: string | null
	individualPdfUrls: string[]
	originalFileName?: string | null
}

const PdfActions: React.FC<PdfActionsProps> = ({
	pages,
	mergedPdfUrl,
	individualPdfUrls,
	originalFileName,
}) => {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [previewTitle, setPreviewTitle] = useState<string | null>(null)
	if (pages.length === 0) return null

	const handleOpenMergedPreview = () => {
		if (!mergedPdfUrl) return
		setPreviewUrl(mergedPdfUrl)
		setPreviewTitle(pages.length === 1 ? "PDF" : "Todas as páginas (A4)")
	}

	const handleOpenIndividualPreview = (url: string, index: number) => {
		if (!url) return
		setPreviewUrl(url)
		setPreviewTitle(`Página ${index + 1}`)
	}

	const renderPage = (page: PageData, index: number) => {
		return (
			<div
				key={index}
				className="bg-primary rounded-lg shadow-md border border-white p-4 flex flex-col items-center mb-6 w-full sm:w-1/2 lg:w-1/3"
			>
				<div className="font-semibold text-lg mb-2 text-white">
					Página {index + 1}
				</div>
				<img
					src={page.imgDataUrl}
					alt={`Página ${index + 1}`}
					className="w-full h-48 object-contain rounded-lg mb-4"
				/>
				{pages.length > 1 && individualPdfUrls[index] && (
					<button
						onClick={() =>
							handleOpenIndividualPreview(individualPdfUrls[index], index)
						}
						className="bg-primary text-white border-2 border-tertiary rounded px-4 py-2 font-medium hover:bg-tertiary hover:text-primary transition"
					>
						Visualizar / Baixar esta Página
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
						onClick={handleOpenMergedPreview}
						className="bg-tertiary text-primary border-2 border-tertiary rounded-lg px-6 py-2 font-semibold shadow hover:bg-primary/90 hover:text-white transition"
					>
						{pages.length === 1
							? "Visualizar / Baixar PDF"
							: "Visualizar / Baixar PDF com todas as páginas"}
					</button>
				</div>
			)}
			<h3 className="text-xl font-bold text-center mb-4 text-white">
				Arquivo carregado:
			</h3>
			<div className="flex flex-wrap gap-6 justify-center">
				{pages.map(renderPage)}
			</div>

			{/* Preview Modal */}
			{previewUrl && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
					<div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden">
						<div className="flex items-center justify-between p-3 border-b">
							<div className="font-semibold">{previewTitle}</div>
							<div className="flex gap-2">
								{previewUrl && (
									<a
										href={previewUrl}
										download={
											originalFileName
												? `formatado - ${originalFileName}`
												: "download.pdf"
										}
										className="bg-tertiary text-white px-3 py-1 rounded"
									>
										Baixar
									</a>
								)}
								<button
									onClick={() => setPreviewUrl(null)}
									className="px-3 py-1 border rounded"
								>
									Fechar
								</button>
							</div>
						</div>
						<div className="h-full">
							<object
								data={previewUrl}
								type="application/pdf"
								className="w-full h-full"
							>
								<p>
									Seu navegador não suporta visualização embutida de PDF.
									<a href={previewUrl}>Baixar o PDF</a>
								</p>
							</object>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default PdfActions
