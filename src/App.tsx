import { GlobalWorkerOptions } from "pdfjs-dist"
import { usePdfPages } from "./hooks/usePdfPages"
import PdfUploader from "./components/PdfUploader"
import PdfActions from "./components/PdfActions"
import MaxRowsInput from "./components/MaxRowsInput"
import { useEffect, useState } from "react"

// Worker correto
GlobalWorkerOptions.workerSrc =
	"https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"

function App() {
	const {
		pages,
		loading,
		progress,
		extractPages,
		mergedPdfUrl,
		individualPdfUrls,
		generateAllPDFs,
		originalFileName,
	} = usePdfPages()

	// Estado para o número máximo de linhas por página A4
	const [maxRows, setMaxRows] = useState<number | undefined>(undefined)
	// Novo estado: quando true, monta um A4 com UMA RÉPLICA de cada página do arquivo
	// alinhadas lado a lado (wrap para próxima linha quando necessário)
	const [tileAllPagesOnA4, setTileAllPagesOnA4] = useState<boolean>(false)

	const handleFileSelected = (file: File) => {
		// Passa o número máximo de linhas e se deve montar o A4 com todas as páginas
		extractPages(file, maxRows, tileAllPagesOnA4)
	}

	useEffect(() => {
		if (pages.length > 0) {
			// Regenera com as novas configurações: maxRows e tileAllPagesOnA4
			generateAllPDFs(pages, maxRows, tileAllPagesOnA4)
		}
	}, [maxRows, tileAllPagesOnA4])

	return (
		<div className="flex flex-col min-h-screen bg-primary">
			<div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
				<div className="flex flex-col items-center gap-4 w-full max-w-xl">
					<h1 className=" text-6xl text-center font-bold text-white mt-2">
						Gerador de PDF para impressão{" "}
					</h1>
					<span className="mb-2 text-tertiary font-bold text-3xl">
						{" "}
						by Fred!
					</span>
					<p className="text-green mb-1 text-center">
						Faça upload de um arquivo PDF com sua arte e o sistema gera
						automaticamente uma folha A4 preenchida com várias cópias
						organizadas para impressão.
					</p>
					<p className="text-green mb-1 text-center">
						Tudo acontece no navegador. Nenhum arquivo é enviado para
						servidores.
					</p>
					<p className="text-tertiary mb-4 text-center">
						Carregue seu PDF abaixo e faça o download como preferir!
					</p>
					<div className="w-full flex flex-col gap-4 items-center">
						<PdfUploader
							onFileSelected={handleFileSelected}
							loading={loading}
							progress={progress}
						/>
						{/* Toggle para montar um A4 com uma réplica de cada página do arquivo */}
						<div className="flex items-center gap-2 text-white">
							<input
								type="checkbox"
								id="tileAll"
								checked={tileAllPagesOnA4}
								onChange={(e) => setTileAllPagesOnA4(e.target.checked)}
								className="w-4 h-4"
							/>
							<label htmlFor="tileAll" className="text-sm">
								Colocar 1 réplica de cada página em A4 (lado a lado)
							</label>
						</div>
						{/* Componente para configurar o número máximo de linhas por página A4 */}
						<MaxRowsInput
							value={maxRows}
							onChange={(n: number | undefined) => setMaxRows(n)}
						/>
						<PdfActions
							pages={pages}
							mergedPdfUrl={mergedPdfUrl}
							individualPdfUrls={individualPdfUrls}
							// nome original do arquivo para formar nomes de download
							originalFileName={originalFileName}
						/>
					</div>
				</div>
			</div>
			<footer className="mt-auto py-4 text-center text-sm text-gray-500">
				Made with <span>❤️</span> by{" "}
				<a
					href="https://ricardothiesen.com.br"
					className="underline hover:text-tertiary"
				>
					Ricardo Frederico Thiesen
				</a>
			</footer>
		</div>
	)
}

export default App
