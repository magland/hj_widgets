import React, { Component } from 'react';
import TimeseriesView from '../TimeseriesView/TimeseriesView';
import { IconButton, Table, TableBody, TableRow, TableCell } from '@material-ui/core';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

export default class NtrodeView extends Component {
    state = {}
    render() {
        const { data } = this.props;
        console.log('ntrode render', this.props);
        console.log('ntrode data', data);
        return (
            <div>
                <h3>Ntrode: {data.name}</h3>
                <NtrodeInfoTable data={data} />
                <Collapsible title="View timeseries" collapsible={true} initExpanded={false} key={data.recording_file}>
                    <TimeseriesView
                        recordingPath={data.recording_file}
                        reactopyaParent={this.props.reactopyaParent}
                        reactopyaChildId={'timeseries'}
                        samplerate={data.samplerate}
                        width={this.props.width || 1200}
                        height={500}
                        key={data.recording_file}
                    />
                </Collapsible>
            </div>
        );
    }
}

class NtrodeInfoTable extends Component {
    constructor(props) {
        super(props);
        this.state={};
    }
    render() {
        const { data } = this.props;
        const fields = [
            {key: 'name', label: 'Ntrode name'},
            {key: 'num_channels', label: 'Num. channels'},
            {key: 'num_timepoints', label: 'Num. timepoints'},
            {key: 'samplerate', label: 'Sampling frequency (Hz)'}
        ];
        return (
            <Table>
                <TableBody>
                    {
                        fields.map((field) => (
                            <TableRow>
                                <TableCell>{field.label}</TableCell>
                                <TableCell>{data[field.key]}</TableCell>
                            </TableRow>
                        ))
                    }
                </TableBody>
            </Table>
        );
    }
}

class Collapsible extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false
        }
    }
    componentDidMount() {
        this.setState({
            expanded: this.props.initExpanded
        });
    }
    toggle = () => {
        this.setState({
            expanded: !this.state.expanded
        })
    }
    render() {
        if (!this.props.collapsible) {
            return (
                <span>
                    <h4>{this.props.title}</h4>
                    {this.props.children}
                </span>
            );
        }
        else if (this.state.expanded) {
            return (
                <span>
                    <h4><IconButton onClick={this.toggle}><FaChevronDown /></IconButton> {this.props.title}</h4>
                    {this.props.children}
                </span>
            );
        }
        else {
            return (
                <span>
                    <h4><IconButton onClick={this.toggle}><FaChevronRight /></IconButton> {this.props.title}</h4>
                </span>
            );
        }
    }
}