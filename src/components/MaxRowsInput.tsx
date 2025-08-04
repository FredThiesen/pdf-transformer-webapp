import React from "react"

interface MaxRowsInputProps {
	value: number | undefined
	onChange: (value: number | undefined) => void
}

const MaxRowsInput: React.FC<MaxRowsInputProps> = ({ value, onChange }) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = event.target.value
		const numericValue = inputValue ? parseInt(inputValue, 10) : undefined
		onChange(numericValue)
	}

	return (
		<div className="flex flex-col gap-2 p-2">
			<label htmlFor="maxRows" className="text-sm text-white">
				Número máximo de linhas por página A4 (opcional):
			</label>
			<input
				id="maxRows"
				type="number"
				min="1"
				placeholder="Deixe em branco para usar o máximo de linhas possível"
				value={value || ""}
				onChange={handleChange}
				className="block w-full max-w-sm text-lg text-white bg-primary border border-tertiary rounded-lg cursor-text focus:outline-none focus:ring-2 focus:ring-tertiary transition-all p-2"
			/>
		</div>
	)
}

export default MaxRowsInput
