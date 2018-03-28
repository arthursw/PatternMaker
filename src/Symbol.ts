import * as paper from 'paper';
import { Bounds } from './Bounds';
import { ColorGenerator, colorGenerators } from './ColorGenerator';

export interface SymbolInterface {
	next(bounds: Bounds, container: Bounds, positions?: number[]): paper.Path // generates a paper.Path
	hasFinished(): boolean
	reset(bounds: Bounds): void
}

export class Symbol implements SymbolInterface {
	colorGenerator: ColorGenerator

	static passParametersColors(symbol: { colors?: any, parameters: any }, colors?: any) {
		return symbol.parameters.colors ? symbol.parameters : {...symbol.parameters, colors: colors }
	}
	
	static passParameters(parameters: { symbol: any, colors?: any }) {
		return Symbol.passParametersColors(parameters.symbol, parameters.colors)
	}

	constructor(parameters: { colors?: any }) {
		if(parameters.colors != null) {
			let Color = colorGenerators.get(parameters.colors.type)
			this.colorGenerator = new Color(parameters.colors.parameters)
		}
	}

	next(bounds: Bounds, container: Bounds, positions?: number[]): paper.Path {
		return null
	}

	hasFinished(): boolean {
		return true
	}

	reset(bounds: Bounds): void {

	}
}

export interface SymbolConstructor {
	new (...args: any[]): Symbol;
}
