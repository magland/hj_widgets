import CanvasWidget from '../jscommon/CanvasWidget';
export { PainterPath } from '../jscommon/CanvasWidget';

export default class TimeWidget extends CanvasWidget {
    constructor(props) {
        super(props);

        this._panels = [];
        this._timeRange = [0, 10000];
        this._timeRangeChangedHandlers = [];
        this._currentTime = null;
        this._anchorTimeRange = null;
        this._zoomAmplitudeHandlers = [];

        this.mouseHandler().onMousePress(this.handle_mouse_press);
        this.mouseHandler().onMouseRelease(this.handle_mouse_release);
        this.mouseHandler().onMouseDrag(this.handle_mouse_drag);
        this.mouseHandler().onMouseDragRelease(this.handle_mouse_drag_release);

        this.onKeyPress(this.handle_key_press);
    }
    initializeTimeWidget() {
        this._mainLayer = this.addCanvasLayer(this.paintMainLayer);
        this._cursorLayer = this.addCanvasLayer(this.paintCursorLayer);
    }
    paintMainLayer = (painter) => {
        let W = this.props.width;
        let H = this.props.height;
        painter.clearRect(0, 0, W, H);

        painter.useCoords();
        for (let panel of this._panels) {
            this.setCoordXRange(this._timeRange[0], this._timeRange[1]);
            // v1=-1 => y1
            //  v2=1 => y2
            // (v1-a) / (b-a) * H = y1
            // (v2-a) / (b-a) * H = y2
            // v1 - a = y1/H * (b-a) 
            // v2 - a = y2/H * (b-a) 
            // (v2 - v1) = (y2-y1)/H * (b-a)
            // b-a = (v2-v1) / (y2-y1) * H
            // a = v1 - y1/H*(b-a)
            let v1 = panel._coordYRange[0];
            let v2 = panel._coordYRange[1];
            let b_minus_a = (v2 - v1) / (panel._yRange[1] - panel._yRange[0]) * this.props.height;
            let a = v1 - panel._yRange[0] * b_minus_a / this.props.height;
            let b = a + b_minus_a;

            this.setCoordYRange(a, b);
            panel.paint(painter);
        }
    }
    paintCursorLayer = (painter) => {
        let W = this.props.width;
        let H = this.props.height;
        painter.clearRect(0, 0, W, H);

        this.setCoordXRange(this._timeRange[0], this._timeRange[1]);
        this.setCoordYRange(0, 1);
        painter.useCoords();

        if (this._currentTime !== null) {
            painter.setPen({width:4, color: 'blue'});
            painter.drawLine(this._currentTime, 0, this._currentTime, 1);
        }
    }
    currentTime() {
        return this._currentTime;
    }
    setCurrentTime(t) {
        if (t < 0) t = 0;
        if (t >= this.props.num_timepoints)
            t = this.props.num_timepoints - 1;
        if (this._currentTime === t)
            return;
        this._currentTime = t;
        this._cursorLayer.repaint();
    }
    setTimeRange(trange) {
        let tr = clone(trange);
        if (tr[1] >= this.props.num_timepoints) {
            let delta = this.props.num_timepoints -1 - tr[1];
            tr[0] += delta;
            tr[1] += delta;
        }
        if (tr[0] < 0) {
            let delta = -tr[0];
            tr[0] += delta;
            tr[1] += delta;
        }
        if (tr[1] >= this.props.num_timepoints) {
            tr[1] = this.props.num_timepoints - 1;
        }
        if ((this._timeRange[0] === tr[0]) && (this._timeRange[1] === tr[1]))
            return;
        this._timeRange = tr;
        this.repaint();        
    }
    timeRange() {
        return [this._timeRange[0], this._timeRange[1]];
    }
    onTimeRangeChanged(handler) {
        this._timeRangeChangedHandlers.push(handler);
    }
    clearPanels() {
        this._panels = [];
        this.updateLayout();
    }
    addPanel(onPaint, opts) {
        let panel = new TimeWidgetPanel(onPaint);
        this._panels.push(panel);
        this.updateLayout();
    }
    updateLayout() {
        let H0 = this.props.height;
        let panelHeight = H0 / this._panels.length;
        let y0 = 0;
        for (let panel of this._panels) {
            panel.setYRange(y0, y0+panelHeight);
            panel.setCoordYRange(-1, 1);

            y0 += panelHeight;
        }
        this.setSize(this.props.width, this.props.height);
    }
    pixToTime(pix) {
        let coords = this.pixToCoords(pix);
        return coords[0];
    }
    handle_mouse_press = (X) => {
        let t = this.pixToTime(X.pos);
        this._anchorTimeRange = clone(this._timeRange);
    }

    handle_mouse_release = (X) => {
        const t = this.pixToTime(X.pos);
        this.setCurrentTime(t);
    }

    handle_mouse_drag = (X) => {
        let t1 = this.pixToTime(X.anchor);
        let t2 = this.pixToTime(X.pos);
        let tr = clone(this._anchorTimeRange);
        tr[0] += t1 - t2;
        tr[1] += t1 - t2;
        this.setTimeRange(tr);
    }

    handle_mouse_drag_release = (X) => {
    }

    handle_key_press = (evt) => {
        console.log('--- handle_key_press', evt);
        switch (event.keyCode) {
            case 38: this.handle_key_up(event); event.preventDefault(); return false;
            case 40: this.handle_key_down(event); event.preventDefault(); return false;
            case 37: this.handle_key_left(event); event.preventDefault(); return false;
            case 39: this.handle_key_right(event); event.preventDefault(); return false;
            case 187: this.zoomTime(1.15); event.preventDefault(); return false;
            case 189: this.zoomTime(1 / 1.15); event.preventDefault(); return false;
            default: console.info('key: ' + event.keyCode);
        }
    }

    handle_key_up = (X) => {
        this.zoomAmplitude(1.15);
    }
    handle_key_down = (X) => {
        this.zoomAmplitude(1 / 1.15);
    }
    handle_key_left = (X) => {
        let span = this._timeRange[1] - this._timeRange[0];
        this.translateTime(-span * 0.2);
    }
    handle_key_right = (X) => {
        let span = this._timeRange[1] - this._timeRange[0];
        this.translateTime(span * 0.2);
    }
    onZoomAmplitude(handler) {
        this._zoomAmplitudeHandlers.push(handler);
    }
    zoomAmplitude(factor) {
        for (let handler of this._zoomAmplitudeHandlers) {
            handler(factor);
        }
    }
    translateTime(delta_t) {
        let tr = clone(this._timeRange);
        tr[0] += delta_t;
        tr[1] += delta_t;
        let t0 = this._currentTime + delta_t;
        this.setCurrentTime(t0);
        this.setTimeRange(tr);
    }
    zoomTime(factor) {

    }

    render() {
        return this.renderCanvasWidget();
    }
}


class TimeWidgetPanel {
    constructor(onPaint) {
        this.onPaint = onPaint;
        this.timeRange = null;
        this._yRange = [0, 1];
        this._coordYRange = [-1, 1];
    }
    setYRange(y1, y2) {
        this._yRange = [y1, y2];
    }
    setCoordYRange(y1, y2) {
        this._coordYRange = [y1, y2];
    }
    paint(painter) {
        this.onPaint(painter);
    }
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}