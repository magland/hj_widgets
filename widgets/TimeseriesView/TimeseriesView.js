import { PythonInterface } from 'reactopya';
import React, { Component } from 'react';
import Mda from './Mda';
import TimeseriesWidget from "./TimeseriesWidget";
import TimeseriesModel from "./TimeseriesModel";
import AutoDetermineWidth from '../jscommon/AutoDetermineWidth';
const config = require('./TimeseriesView.json');


export default class TimeseriesView extends Component {
    static title = 'Timeseries view'
    static reactopyaConfig = config;
    render() {
        return (
            <AutoDetermineWidth>
                <TimeseriesViewInner {...this.props} />
            </AutoDetermineWidth>
        );
    }
}

class TimeseriesViewInner extends Component {
    constructor(props) {
        super(props)
        this.state = {
            // javascript state
            recordingPath: null,
            download_from: null,
            segmentSize: null,
            segmentsRequested: null,

            // python state
            numChannels: null,
            numTimepoints: null,
            samplerate: null,
            status_message: '',

            // other
            timeseriesModelSet: false // to trigger re-render
        }
        this.timeseriesModel = null;
        this.segmentsRequested = {};
    }

    componentDidMount() {
        this.pythonInterface = new PythonInterface(this, config);
        this.pythonInterface.setState({
            recordingPath: this.props.recordingPath,
            download_from: this.props.download_from,
            segmentSize: 100000
        });
        this.pythonInterface.start();
        this.updateData();
    }
    componentDidUpdate() {
        this.updateData();
    }
    componentWillUnmount() {
        this.pythonInterface.stop();
    }

    updateData() {
        if (!this.state.numChannels) return;
        if (!this.timeseriesModel) {
            if (!this.state.samplerate) {
                return;
            }
            const params = {
                samplerate: this.state.samplerate,
                num_channels: this.state.numChannels,
                num_timepoints: this.state.numTimepoints,
                segment_size: this.state.segmentSize
            };
            this.timeseriesModel = new TimeseriesModel(params);
            this.timeseriesModel.onRequestDataSegment((ds_factor, segment_num) => {
                let sr = this.segmentsRequested;
                let code = `${ds_factor}-${segment_num}`;
                sr[code] = { ds: ds_factor, ss: segment_num };
                this.segmentsRequested = sr;
                this.pythonInterface.setState({
                    segmentsRequested: sr
                });
            });
            this.setState({
                timeseriesModelSet: true
            });
        }
        let SR = this.segmentsRequested;
        let keys = Object.keys(SR);
        let something_changed = false;
        for (let key of keys) {
            let aa = this.state[key] || null;
            if ((aa) && (aa.data)) {
                let X = new Mda();
                X.setFromBase64(aa.data);
                this.timeseriesModel.setDataSegment(aa.ds, aa.ss, X);
                delete SR[key];
                // delete SF[key];
                something_changed = true;
            }
        }
        if (something_changed) {
            this.segmentsRequested = SR;
            this.pythonInterface.setState({
                segmentsRequested: SR
            });
        }
    }
    render() {
        if (this.timeseriesModel) {
            return (
                <div>
                    <TimeseriesWidget
                        timeseriesModel={this.timeseriesModel}
                        width={this.props.width}
                        height={this.props.height || 500}
                    />
                    <div>{this.state.status_message}</div>
                </div>
            )
        }
        else {
            return (
                <div>{this.state.status_message}</div>
            );
        }
    }
}
