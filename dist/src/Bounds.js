import * as paper from 'paper';
export class Bounds {
    constructor(bounds, rotation = 0) {
        this.set(bounds, rotation);
    }
    set(bounds, rotation = 0) {
        this.rectangle = bounds instanceof paper.Path ? bounds.bounds.clone() : bounds.clone();
        this.path = bounds instanceof paper.Path ? bounds : null;
        this.rotation = rotation;
    }
    setPosition(position) {
        if (this.path != null) {
            let delta = this.rectangle.point.subtract(this.path.position);
            this.path.position = position.clone();
            this.rectangle.point = position.add(delta);
        }
        else {
            this.rectangle.point = position.clone();
        }
    }
    setX(x) {
        this.setXY(x, this.rectangle.y);
    }
    setY(y) {
        this.setXY(this.rectangle.x, y);
    }
    setXY(x, y) {
        this.setPosition(new paper.Point(x, y));
    }
    setCenter(position) {
        let delta = this.rectangle.topLeft.subtract(this.rectangle.center);
        this.setPosition(position.add(delta));
    }
    setSize(size) {
        if (this.path != null) {
            this.path.bounds.size = size;
        }
        this.rectangle.size = size;
    }
    setWidth(width) {
        this.setWH(width, this.rectangle.height);
    }
    setHeight(height) {
        this.setWH(this.rectangle.width, height);
    }
    setWH(width, height) {
        this.setSize(new paper.Size(width, height));
    }
    getRectangle() {
        return this.rectangle.clone();
    }
    getPath() {
        if (this.path == null) {
            this.path = new paper.Path.Rectangle(this.rectangle);
        }
        return this.path;
    }
    clone() {
        return new Bounds(this.getPath());
    }
}
//# sourceMappingURL=Bounds.js.map