import React, { Component } from 'react';
import Autocorrelograms from '../Autocorrelograms/Autocorrelograms';
import { IconButton, Table, TableBody, TableRow, TableCell } from '@material-ui/core';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

export default class SortingResultsView extends Component {
    state = {}
    render() {
        const { data } = this.props;
        return (
            <div>
                <h3>Sorting results</h3>
                <SortingResultsInfoTable data={data} />
                <Collapsible title="View autocorrelograms" collapsible={true} initExpanded={false} key={data.firings_path}>
                    <Autocorrelograms
                        firingsPath={data.firings_path}
                        samplerate={30000} // fix this
                        reactopyaParent={this.props.reactopyaParent}
                        reactopyaChildId={'Autocorrelograms'}
                    />
                </Collapsible>
            </div>
        );
    }
}

class SortingResultsInfoTable extends Component {
    constructor(props) {
        super(props);
        this.state={};
    }
    render() {
        const { data } = this.props;
        let fields = [
            {key: 'epoch_name', label: 'Epoch'},
            {key: 'ntrode_name', label: 'Ntrode'},
            {key: 'num_events', label: 'Num. events'},
            {key: 'unit_ids', label: 'Units', format: (x) => (x.join(', '))}
        ];
        fields.forEach(field => {
            field.format = field.format || function(x) {return x;};
        });
        
        return (
            <Table>
                <TableBody>
                    {
                        fields.map((field) => (
                            <TableRow key={field.name}>
                                <TableCell key="label">{field.label}</TableCell>
                                <TableCell key="value">{field.format(data[field.key])}</TableCell>
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