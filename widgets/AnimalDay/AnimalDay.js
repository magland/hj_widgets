import React, { Component } from 'react';
import Grid from '@material-ui/core/Grid';
import { PythonInterface } from 'reactopya';
import BrowserTree, { TreeData } from './BrowserTree/BrowserTree';
import { Table, TableBody, TableRow, TableCell, TableHead, Link } from '@material-ui/core';
import NtrodeView from './NtrodeView';
import HBox from '../HBox/HBox';
const config = require('./AnimalDay.json');

export default class AnimalDay extends Component {
    static title = 'View of ephys data for a single animal day'
    static reactopyaConfig = config
    constructor(props) {
        console.log('--- animalday constructor', props);
        super(props);
        this.state = {
            // javascript state
            path: null,

            // python state
            status: '',
            status_message: '',
            object: null,

            // other
            selectedNodeData: null,
            selectedNodePath: null
        }
        this.treeData = new TreeData;
    }
    componentDidMount() {
        this.pythonInterface = new PythonInterface(this, config);
        this.pythonInterface.setState({
            path: this.props.path
        });
        this.pythonInterface.start();
    }
    componentWillUnmount() {
        this.pythonInterface.stop();
    }
    onItemSelected = (item) => {
        if ((item) && (item.data.object) && (item.data.object.type)) {
            this.setState({
                selectedNodeData: item.data.object
            });
        }
    }
    handleNtrodeClicked = (epochName, ntrodeName) => {
        this.setState({
            selectedNodeData: this.state.object.epochs[epochName].ntrodes[ntrodeName],
            selectedNodePath: `epochs.${epochName}.ntrodes.${ntrodeName}`
        });
    }
    render() {
        console.log('--- animalday render', this.state, this.props);
        let content = (
            <HBox width={this.props.width}>
                <BrowserTree
                    path={null}
                    object={this.state.object}
                    treeData={this.treeData}
                    selectedNodePath={this.state.selectedNodePath}
                    onItemSelected={this.onItemSelected}
                    pathHistory={null}
                    onGotoHistory={null}
                    kacheryManager={null}
                />
                <ContentView
                    data={this.state.selectedNodeData}
                    onNtrodeClicked={this.handleNtrodeClicked}
                    reactopyaParent={this}
                />
            </HBox>
        )
        // let content = (
        //     <Grid container spacing={3}>
        //         <Grid item xs={12} md={6} lg={4} xl={3}>
        //             <BrowserTree
        //                 path={null}
        //                 object={this.state.object}
        //                 treeData={this.treeData}
        //                 selectedNodePath={this.state.selectedNodePath}
        //                 onItemSelected={this.onItemSelected}
        //                 pathHistory={null}
        //                 onGotoHistory={null}
        //                 kacheryManager={null}
        //             />
        //         </Grid>
        //         <Grid item xs={12} md={6} lg={8} xl={9}>
        //             <ContentView
        //                 data={this.state.selectedNodeData}
        //                 onNtrodeClicked={this.handleNtrodeClicked}
        //                 reactopyaParent={this}
        //             />
        //         </Grid>
        //     </Grid>
        // );
        return (
            <React.Fragment>
                <div>AnimalDay</div>
                <RespectStatus {...this.state}>
                    {content}
                </RespectStatus>
            </React.Fragment>
        )
    }
}

class ContentView extends Component {
    state = {}
    render() {
        const { data } = this.props;
        let props = {
            width: this.props.width
        };
        if (!data) {
            return (
                <div></div>
            );
        }
        if (data.type === 'epoch') {
            return (
                <EpochView
                    data={data}
                    onNtrodeClicked={this.props.onNtrodeClicked}
                    {...props}
                />
            );
        }
        else if (data.type === 'ntrode') {
            return (
                <NtrodeView
                    data={data}
                    reactopyaParent={this.props.reactopyaParent}
                    {...props}
                />
            );
        }
        else {
            return (
                <div>
                    Unrecognized type in data:
                    <pre>{JSON.stringify(data, null, 4)}</pre>
                </div>
            );
        }
    }
}

class EpochView extends Component {
    state = {}
    handleNtrodeClicked = (epochName, ntrodeName) => {
        this.props.onNtrodeClicked && this.props.onNtrodeClicked(epochName, ntrodeName)
    }
    render() {
        const { data } = this.props;
        let epochName = data.name;
        return (
            <div>
                <h3>Epoch: {data.name}</h3>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ntrodes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            Object.entries(data.ntrodes).map(([ntrodeName, ntrode]) => (
                                <TableRow key={ntrodeName}>
                                    <TableCell>
                                        <Link2 onClick={() => this.handleNtrodeClicked(epochName, ntrodeName)}>
                                            {ntrodeName}
                                        </Link2>
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </div>
        );
    }
}

class RespectStatus extends Component {
    state = {}
    render() {
        switch (this.props.status) {
            case 'running':
                return <div>Running: {this.props.status_message}</div>
            case 'error':
                return <div>Error: {this.props.status_message}</div>
            case 'finished':
                return this.props.children;
            default:
                return <div>Unknown status: {this.props.status}</div>
        }
    }
}

function Link2(props) {
    return (
        <Link
            component="button" variant="body2"
            onClick={props.onClick}
        >
            {props.children}
        </Link>
    )
}