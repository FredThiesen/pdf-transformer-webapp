export interface FittedSize {
	w: number
	h: number
	scale: number
}

export function getFittedSize(
	artW: number,
	artH: number,
	pageW: number,
	pageH: number,
	gap: number,
): FittedSize {
	const maxW = pageW
	const maxH = pageH
	const sW = maxW / artW
	const sH = maxH / artH
	const s = Math.min(1, sW, sH) // não aumenta, só reduz
	console.log(
		`[layout] getFittedSize artW=${artW} artH=${artH} pageW=${pageW} pageH=${pageH} gap=${gap} scale=${s} fittedW=${artW * s} fittedH=${artH * s}`,
	)
	return { w: artW * s, h: artH * s, scale: s }
}

export interface GridLayoutResult {
	tileW: number
	tileH: number
	cols: number
	rowsAvailable: number
	microScale: number
}

export function computeGridLayout({
	tileW,
	tileH,
	pageW,
	pageH,
	gap,
	epsilon,
}: {
	tileW: number
	tileH: number
	pageW: number
	pageH: number
	gap: number
	epsilon: number
}): GridLayoutResult {
	let cols = Math.max(1, Math.floor((pageW + gap) / (tileW + gap)))
	let rowsAvailable = Math.max(1, Math.floor((pageH + gap) / (tileH + gap)))

	const tryCols = cols + 1
	const tryRows = rowsAvailable + 1
	const neededW = tryCols * tileW + (tryCols - 1) * gap
	const neededH = tryRows * tileH + (tryRows - 1) * gap
	const scaleForCols =
		neededW > pageW && neededW - pageW <= epsilon
			? (pageW - (tryCols - 1) * gap) / (tryCols * tileW)
			: 1
	const scaleForRows =
		neededH > pageH && neededH - pageH <= epsilon
			? (pageH - (tryRows - 1) * gap) / (tryRows * tileH)
			: 1
	const microScale = Math.min(scaleForCols, scaleForRows, 1)

	if (microScale < 1) {
		const adjustedTileW = tileW * microScale
		const adjustedTileH = tileH * microScale
		console.log(
			`[layout] microScale applied scale=${microScale} tileW=${tileW} tileH=${tileH} adjustedTileW=${adjustedTileW} adjustedTileH=${adjustedTileH} tryCols=${tryCols} tryRows=${tryRows} epsilon=${epsilon}`,
		)
		tileW = adjustedTileW
		tileH = adjustedTileH
		cols = Math.max(1, Math.floor((pageW + gap) / (tileW + gap)))
		rowsAvailable = Math.max(1, Math.floor((pageH + gap) / (tileH + gap)))
	}

	return {
		tileW,
		tileH,
		cols,
		rowsAvailable,
		microScale,
	}
}
