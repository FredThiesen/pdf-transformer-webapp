import React from "react"

interface GeneratePDFProps {
	onGenerate: () => void
	disabled?: boolean
}

const GeneratePDF: React.FC<GeneratePDFProps> = ({ onGenerate, disabled }) => {
	return (
		<button
			onClick={onGenerate}
			disabled={disabled}
			className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
		>
			Gerar PDF
		</button>
	)
}

export default GeneratePDF
