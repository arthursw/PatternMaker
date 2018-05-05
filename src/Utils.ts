import * as paper from 'paper';

export function sizeToPoint(size: paper.Size): paper.Point {
	return <any>size
}

export function degreesToRadians(angle: number): number {
	return 2 * Math.PI * angle / 360
}

export function createArc(center: paper.Point, radius: number, angleDegrees: number){
	let angleRadians = degreesToRadians(angleDegrees)
    return {
        from: {
            x: center.x + radius,
            y: center.y
        },
        through: {
            x: center.x + Math.cos(angleRadians / 2) * radius,
            y: center.y + Math.sin(angleRadians / 2) * radius
        },
        to: {
            x: center.x + Math.cos(angleRadians) * radius,
            y: center.y + Math.sin(angleRadians) * radius
        }
    }
}
