import React from "react"

interface UploadPDFProps {
	onFileSelected: (file: File) => void
}

const UploadPDF: React.FC<UploadPDFProps> = ({ onFileSelected }) => {
	return (
		<div className="mb-4">
			<label className="block mb-2 font-medium">
				Selecione um arquivo PDF:
			</label>
			<input
				type="file"
				accept="application/pdf"
				onChange={(e) => {
					try {
						if (e.target.files && e.target.files[0]) {
							onFileSelected(e.target.files[0])
						}
					} catch (error) {
						console.error("Erro ao selecionar arquivo PDF:", error)
						alert("Erro ao selecionar arquivo PDF: " + error)
					}
				}}
				className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
			/>
		</div>
	)
}

export default UploadPDF
