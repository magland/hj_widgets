import React, { Component } from "react";
import { PainterPath, MouseHandler, CanvasPainter } from "./CanvasPainter"
import CanvasWidget from '../jscommon/CanvasWidget';
export default class TimeseriesWidget extends CanvasWidget {
    /*
    props.timeseriesModel
    props.markers
    */
    constructor(props) {
        super(props);

        this.timeRange = [0, 1000];
        this.currentTime = -1; // the timepoint of the current cursor
        this.y_scale_factor = 1; // the vertical (amplitude) scale factor
        this.y_offsets = null; // the offsets of the channels (in amp units)
        this.mouse_press_anchor_pos = null;
        this.mouse_press_anchor_moving = false;
        this.mouse_press_anchor_trange = null;

        // margins for the view (in pixels)
        this.margins = { top: 15, bottom: 15, left: 15, right: 15 };

        this.mainLayer = this.addCanvasLayer(this.paintMainLayer);
        this.cursorLayer = this.addCanvasLayer(this.paintCursorLayer);

        this.mouseHandler().onMousePress(this.handle_mouse_press);
        this.mouseHandler().onMouseRelease(this.handle_mouse_release);
        this.mouseHandler().onMouseMove(this.handle_mouse_move);
        this.mouseHandler().onMouseDrag(this.handle_mouse_drag);
        this.mouseHandler().onMouseDragRelease(this.handle_mouse_drag_release);

        // computed in painting, etc.
        this.channel_y_positions = null; // the y positions of channels in pixels
        this.channel_spacing = null; // spacing between channels in pixels
        this.channel_colors = mv_default_channel_colors(); // colors of the channel traces

        // whether we are going to trigger events for sync
        // (sort of a hack, need to fix)
        this.do_trigger = true;
    }

    async componentDidMount() {

        console.log('mount 1');
        // this probably doesn't belong here
        // note: right now the margins and size are constant

        // auto scale based on the timeseries model (this.props.timeseriesModel)
        await this.autoScale();

        console.log('mount 2');

        this.updateSizes();

        console.log('mount 3');

        // this happens when the timeseries model receives new data
        this.props.timeseriesModel.onDataSegmentSet((ds_factor, t1, t2) => {
            if ((t1 <= this.timeRange[1]) && (t2 >= this.timeRange[0])) {
                // if the new chunch is in range of what we are viewing, we repaint
                this.repaint();
            }
        });
        console.log('mount 4');
        this.repaint();
    }

    componentDidUpdate() {
        console.log('update 1');
        this.updateSizes();
        console.log('update 2');
        this.repaint();
        console.log('update 3');
    }

    updateSizes = () => {
        // determine the channel spacing and y positions in pixels
        let M = this.props.timeseriesModel.numChannels();
        let H0 = this.props.height - this.margins.top - this.margins.bottom;;
        this.channel_spacing = H0 / M;
        this.channel_y_positions = [];
        let y0 = this.props.height - this.margins.bottom - this.channel_spacing / 2;
        for (let m = 0; m < M; m++) {
            this.channel_y_positions.push(y0);
            y0 -= this.channel_spacing;
        }
        this.setSize(this.props.width, this.props.height);
        this.setCoordYRange(this.channel_y_positions[M-1] - this.channel_spacing, this.channel_y_positions[0] + this.channel_spacing);
    }

    // render() {
    //     if (!this.y_offsets) {
    //         return <div>Auto scaling...</div>
    //     }

    //     // const canvas_style={
    //     //     position: 'absolute',
    //     //     left: 0,
    //     //     top: 0,
    //     //     width: this.props.width,
    //     //     height: this.props.height
    //     // };

    //     return <div
    //         tabIndex={0} // tabindex needed to handle keypress
    //         onKeyDown={this.handleKeyPress}
    //         style={{
    //             width: this.props.width,
    //             height: this.props.height,
    //             position: 'relative'
    //         }}
    //         onMouseDown={this.mouseHandler.mouseDown}
    //         onMouseUp={this.mouseHandler.mouseUp}
    //         onMouseMove={this.mouseHandler.mouseMove}
    //         onMouseLeave={this.mouseHandler.mouseLeave}
    //         // onWheel={this.mouseHandler.mouseWheel} need to fix this -- having trouble preventing default
    //     >
    //         {main_canvas}
    //         {cursor_canvas}
    //     </div>
    // }

    render() {
        return this.renderCanvasWidget();
    }

    setYOffsets(offsets) {
        this.y_offsets = clone(offsets);
    }
    setYScaleFactor(factor) {
        this.y_scale_factor = factor;
    }
    setSyncGroup(sync_group_name) {
        let sync_groups = window.timeserieswidget_sync_groups;
        if (!(sync_group_name in sync_groups)) {
            sync_groups[sync_group_name] = new SyncGroup();
        }
        let G = sync_groups[sync_group_name];
        G.connect(this);
    }

    _triggerOff() {
        this.do_trigger = false;
    };

    _triggerOn() {
        this.do_trigger = true;
    };

    // Note that we cannot use this method within jupyter notebooks -- need to think about it
    handleKeyPress(event) {
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

    determine_downsample_factor_from_num_timepoints(target_num_pix, num) {
        // determine what the downsample factor should be based on the number
        // of timepoints in the view range
        // we also need to consider the number of pixels it corresponds to
        let ds_factor = 1;
        let factor = 3;
        while (num / (ds_factor * factor) > target_num_pix) {
            ds_factor *= factor;
        }
        return ds_factor;
    }

    paintMainLayer = (painter) => {
        let W = this.props.width;
        let H = this.props.height;

        painter.clearRect(0, 0, W, H);

        let M = this.props.timeseriesModel.numChannels();
        let t1 = Math.floor(this.timeRange[0]);
        let t2 = Math.floor(this.timeRange[1] + 1);
        if (t1 < 0) t1 = 0;
        if (t2 >= this.props.timeseriesModel.numTimepoints()) t2 = this.props.timeseriesModel.numTimepoints();
        let downsample_factor = this.determine_downsample_factor_from_num_timepoints(this.props.width * 1.3, t2 - t1);
        let t1b = Math.floor(t1 / downsample_factor);
        let t2b = Math.floor(t2 / downsample_factor);
        for (let m = 0; m < M; m++) {
            painter.setPen({ 'color': this.channel_colors[m % this.channel_colors.length] });
            let pp = new PainterPath();
            let data0 = this.props.timeseriesModel.getChannelData(m, t1b, t2b, downsample_factor);
            // trigger pre-loading
            this.props.timeseriesModel.getChannelData(m, Math.floor(t1b / 3), Math.floor(t2b / 3), downsample_factor * 3, { request_only: true });
            if ((downsample_factor > 1) && (this.currentTime >= 0)) {
                let t1c = Math.floor(Math.max(0, (this.currentTime - 800) / (downsample_factor / 3)))
                let t2c = Math.floor(Math.min(this.props.timeseriesModel.numTimepoints(), (this.currentTime + 800) / (downsample_factor / 3)))
                this.props.timeseriesModel.getChannelData(m, t1c, t2c, downsample_factor / 3, { request_only: true });
            }
            if (downsample_factor == 1) {
                for (let tt = t1; tt < t2; tt++) {
                    let val = data0[tt - t1];
                    if (!isNaN(val)) {
                        let pt = this.val2pix(m, tt, val);
                        pp.lineTo(pt[0], pt[1]);
                    }
                    else {
                        let pt = this.val2pix(m, tt, 0);
                        pp.moveTo(m, pt[1]);
                    }
                }
            }
            else {
                for (let tt = t1b; tt < t2b; tt++) {
                    let val_min = data0[(tt - t1b) * 2];
                    let val_max = data0[(tt - t1b) * 2 + 1];
                    if ((!isNaN(val_min)) && (!isNaN(val_max))) {
                        let pt_min = this.val2pix(m, tt * downsample_factor, val_min);
                        let pt_max = this.val2pix(m, tt * downsample_factor, val_max);
                        pp.lineTo(pt_min[0], pt_min[1]);
                        pp.lineTo(pt_max[0], pt_max[1]);
                    }
                    else {
                        let pt = this.val2pix(m, tt * downsample_factor, 0);
                        pp.moveTo(pt[0], pt[1]);
                    }
                }
            }
            painter.drawPath(pp);
        }
    }

    paintCursorLayer = (painter) => {
        let W = this.props.width;
        let H = this.props.height;

        painter.clearRect(0, 0, W, H);

        let M = this.props.timeseriesModel.numChannels();
        let pt1 = this.val2pix(M - 1, this.currentTime, -this.y_offsets[M - 1]);
        let pt2 = this.val2pix(0, this.currentTime, -this.y_offsets[0]);
        painter.setPen({width:2, color: 'blue'});
        painter.drawLine(pt1[0], pt1[1] - this.channel_spacing / 2, pt2[0], pt2[1] + this.channel_spacing / 2);
        this.add_markers(painter)
    }

    add_markers(painter) {
        if (!this.props.markers)
            return;
        painter.setFont({ "pixel-size": 18, family: 'Arial' });

        let M = this.props.timeseriesModel.numChannels();
        let i = 0
        for (marker_group of this.props.markers) {
            i = i + 1;
            // col = colorArray[i % colorArray.length]
            col = 'red'
            painter.setPen({ 'color': col });
            painter.setBrush({ 'color': col });
            for (m of marker_group) {
                let pt1 = this.val2pix(M - 1, m, -this.y_offsets[M - 1]);
                let pt2 = this.val2pix(0, m, -this.y_offsets[0]);
                let rect = [pt1[0], pt1[1] - this.channel_spacing / 2, pt2[0], pt2[1] + this.channel_spacing / 2]
                painter.drawLine(...rect);
                rect[0] = rect[0] + 5;
                painter.drawText(rect, { AlignLeft: true, AlignTop: true }, "" + i);
            }
        }
    }

    setTimeRange(t1, t2) {
        let N = this.props.timeseriesModel.numTimepoints();
        if (t2 > N) { t1 -= (t2 - N); t2 -= (t2 - N); };
        if (t1 <= 0) { t2 -= t1; t1 -= t1; };
        if (t2 > N) t2 = N;
        if ((t1 == this.timeRange[0]) && (t2 == this.timeRange[1]))
            return;
        this.timeRange = [t1, t2];
        this.setCoordXRange(t1, t2);
        this.repaint();
        if (this.do_trigger) {
            // TODO: figure out how to do this
            // m_div.trigger('time-range-changed');
        }
    }

    setCurrentTime(t) {
        if (this.currentTime === t)
            return;
        this.currentTime = t;
        if (this.do_trigger) {
            // TODO: Figure out how to do this
            // m_div.trigger('current-time-changed');
        }
    }

    zoomTime(factor) {
        let anchor_time = this.currentTime;
        if ((anchor_time < this.timeRange[0]) || (anchor_time > this.timeRange[1]))
            anchor_time = this.timeRange[0];
        let old_t1 = this.timeRange[0];
        let old_t2 = this.timeRange[1];
        let t1 = anchor_time + (old_t1 - anchor_time) / factor;
        let t2 = anchor_time + (old_t2 - anchor_time) / factor;
        this.setTimeRange(t1, t2);
    }

    translateTime(dt) {
        let old_t1 = this.timeRange[0];
        let old_t2 = this.timeRange[1];
        let t1 = old_t1 + dt;
        let t2 = old_t2 + dt;
        this.setTimeRange(t1, t2);
    }

    zoomAmplitude(factor) {
        this.y_scale_factor *= factor;
        this.repaint();
    }

    val2pix(ch, t, val) {
        let y0 = this.channel_y_positions[ch];
        y0 -= (val + this.y_offsets[ch]) * this.y_scale_factor * this.channel_spacing / 2;
        return [t, y0];
    }

    pix2time(pix) {
        let coords = this.pixToCoords(pix);
        return coords[0];
    }

    async autoScale() {
        await this.auto_compute_y_offsets();
        this.auto_compute_y_scale_factor();
    }

    async auto_compute_y_offsets() {
        let offsets = [];
        let M = this.props.timeseriesModel.numChannels();
        for (let m = 0; m < M; m++) {
            let data = await this.props.timeseriesModel.waitForChannelData(m, 0, Math.min(this.props.timeseriesModel.numTimepoints(), 5000), 1, {timeout: 8000});
            let mean0 = 0;
            if (data) {
                mean0 = compute_mean(data);
            }
            else {
                console.error('Problem auto computing y offsets (timeout while getting data)');
            }
            offsets.push(-mean0);
        }
        this.setYOffsets(offsets);
    }

    auto_compute_y_scale_factor() {
        let vals = [];
        let M = this.props.timeseriesModel.numChannels();
        for (let m = 0; m < M; m++) {
            let data = this.props.timeseriesModel.getChannelData(m, 0, Math.min(this.props.timeseriesModel.numTimepoints(), 5000), 1);
            for (let j in data)
                if (!isNaN(data[j])) {
                    vals.push(Math.abs(data[j] + this.y_offsets[m]));
                }
        }
        if (vals.length > 0) {
            vals.sort(function (a, b) { return a - b });
            let vv = vals[Math.floor(vals.length * 0.9)];
            if (vv > 0)
                this.setYScaleFactor(1 / (2 * vv));
            else
                this.setYScaleFactor(1);
        }
    }

    handle_mouse_press = (X) => {
        //
    }

    handle_mouse_release = (X) => {
        let t0 = this.pix2time(X.pos);
        this.setCurrentTime(t0);
    }

    handle_mouse_drag = (X) => {
        // todo
    }

    handle_mouse_drag_release = (X) => {
        // todo
    }

    handle_mouse_move = (X) => {
        if (this.mouse_press_anchor_pos) {
            if (!this.mouse_press_anchor_moving) {
                let dx = X.pos[0] - this.mouse_press_anchor_pos[0];
                // let dy=X.pos[1]-this.mouse_press_anchor_pos[1];
                if (Math.abs(dx) > 4) {
                    this.mouse_press_anchor_moving = true;
                }
            }

            if (this.mouse_press_anchor_moving) {
                let t1 = this.pix2time(this.mouse_press_anchor_pos);
                let t2 = this.pix2time(X.pos);
                this.setTimeRange(this.mouse_press_anchor_trange[0] + (t1 - t2), this.mouse_press_anchor_trange[1] + (t1 - t2));
                this.mouse_press_anchor_moving = true;
            }
        }
    }

    handle_key_up = (X) => {
        this.zoomAmplitude(1.15);
    }
    handle_key_down = (X) => {
        this.zoomAmplitude(1 / 1.15);
    }
    handle_key_left = (X) => {
        let span = this.timeRange[1] - this.timeRange[0];
        this.translateTime(-span * 0.2);
    }
    handle_key_right = (X) => {
        let span = this.timeRange[1] - this.timeRange[0];
        this.translateTime(span * 0.2);
    }

    handle_mouse_wheel = (X) => {
        if (X.delta > 0) this.zoomTime(1.15);
        else if (X.delta < 0) this.zoomTime(1 / 1.15);
    }
}

function SyncGroup() {
    let that = this;
    this.connect = function (W) { connect(W); };

    let m_widgets = [];

    function connect(W) {
        m_widgets.push(W);
        W.onCurrentTimeChanged(function () {
            m_widgets.forEach(function (W2) {
                W2._triggerOff();
                W2.setCurrentTime(W.currentTime());
                W2._triggerOn();
            })
        });
        W.onTimeRangeChanged(function () {
            let trange = W.timeRange();
            m_widgets.forEach(function (W2) {
                W2._triggerOff();
                W2.setTimeRange(trange[0], trange[1]);
                W2._triggerOn();
            })
        });
    }
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function mv_default_channel_colors() {
    var ret = [];
    ret.push('rgb(40,40,40)');
    ret.push('rgb(64,32,32)');
    ret.push('rgb(32,64,32)');
    ret.push('rgb(32,32,112)');
    return ret;
}

function compute_mean(vals) {
    let sum = 0;
    let count = 0;
    for (let i in vals) {
        if (!isNaN(vals[i])) {
            sum += vals[i];
            count++;
        }
    }
    if (!count) return 0;
    return sum / count;
}

/*
// Standard Normal variate using Box-Muller transform.
function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// from https://gist.github.com/mucar/3898821
var colorArray = [
      '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
		  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
		  '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
		  '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
		  '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
		  '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
		  '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
		  '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
		  '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
      '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
*/
