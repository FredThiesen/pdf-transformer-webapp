import React from "react"

interface ArteConfigProps {
	sizeCm: number
	setSizeCm: (size: number) => void
}

const ArteConfig: React.FC<ArteConfigProps> = ({ sizeCm, setSizeCm }) => {
	return (
		<div className="mb-4">
			<label className="block mb-2 font-medium">Tamanho da arte (cm):</label>
			<input
				type="number"
				min={1}
				max={20}
				step={0.1}
				value={sizeCm}
				onChange={(e) => setSizeCm(Number(e.target.value))}
				className="w-24 p-2 border border-gray-300 rounded"
			/>
			<span className="ml-2">x {sizeCm} cm</span>
		</div>
	)
}

export default ArteConfig
