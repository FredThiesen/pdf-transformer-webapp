import React from "react"

interface PdfUploaderProps {
	onFileSelected: (file: File) => void
	loading: boolean
	progress: { current: number; total: number }
}

const PdfUploader: React.FC<PdfUploaderProps> = ({
	onFileSelected,
	loading,
	progress,
}) => {
	return (
		<div className="flex flex-col items-center w-full gap-2">
			<label
				className="block text-lg font-semibold text-white mb-1"
				htmlFor="pdf-upload"
			>
				Selecione um arquivo PDF:
			</label>
			<input
				id="pdf-upload"
				type="file"
				accept="application/pdf"
				onChange={(e) => {
					const file = e.target.files?.[0]
					if (file) {
						onFileSelected(file)
					}
				}}
				title="Carregue seu PDF aqui!"
				placeholder="Carregue seu PDF aqui!"
				className="block w-full max-w-sm text-sm text-white bg-primary border border-tertiary rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-tertiary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-green hover:file:text-primary hover:file:bg-tertiary/80 transition-all"
			/>
			{loading && (
				<div className="flex flex-col items-center mt-4">
					<div className="loader mb-2" />
					<div className="text-tertiary font-medium animate-pulse">
						Extraindo página {progress.current} de {progress.total}...
					</div>
				</div>
			)}
		</div>
	)
}

export default PdfUploader
