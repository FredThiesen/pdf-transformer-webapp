import React from "react"

interface GapInputProps {
	value: number
	onChange: (value: number) => void
}

const GapInput: React.FC<GapInputProps> = ({ value, onChange }) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = event.target.value
		const numericValue = inputValue ? parseInt(inputValue, 10) : 0
		onChange(Number.isNaN(numericValue) ? 0 : numericValue)
	}

	return (
		<div className="flex flex-col gap-2 p-2">
			<label htmlFor="gap" className="text-sm text-white">
				Espaçamento entre artes (pt):
			</label>
			<input
				id="gap"
				type="number"
				min="0"
				step="1"
				placeholder="2"
				value={value}
				onChange={handleChange}
				className="block w-full max-w-sm text-lg text-white bg-primary border border-tertiary rounded-lg cursor-text focus:outline-none focus:ring-2 focus:ring-tertiary transition-all p-2"
			/>
		</div>
	)
}

export default GapInput
