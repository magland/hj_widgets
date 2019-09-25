import React, { Component } from 'react';
import { PythonInterface } from 'reactopya';
import BrowserTree, { TreeData } from './BrowserTree/BrowserTree';
import EpochView from './EpochView';
import NtrodeView from './NtrodeView';
import SortingResultsView from './SortingResultsView';
import HBox from '../HBox/HBox';
const config = require('./AnimalDay.json');

export default class AnimalDay extends Component {
    static title = 'View of ephys data for a single animal day'
    static reactopyaConfig = config
    constructor(props) {
        super(props);
        this.state = {
            // javascript state
            raw_path: null,
            processed_path: null,

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
            raw_path: this.props.raw_path || this.props.path,  // TODO: allow path for backward compatibility (eventually remove)
            processed_path: this.props.processed_path
        });
        this.pythonInterface.start();
    }
    componentDidUpdate() {
        if ((this.state.object) && (this.props.init_selected_node_path) && (!this.state.selectedNodePath)) {
            this.selectNodeFromPath(this.props.init_selected_node_path);
        }
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
        this.selectNodeFromPath(`epochs/${epochName}/ntrodes/${ntrodeName}`);
    }
    selectNodeFromPath = (path) => {
        let list = path.split('/');
        let ptr = this.state.object;
        for (let val of list) {
            if (ptr) {
                ptr = ptr[val];
            }
        }
        if (ptr) {
            this.setState({
                selectedNodeData: ptr,
                selectedNodePath: path
            });
        }
        else {
            console.warn('Unable to select node from path: ' + path);
        }
    }
    handleViewSortingResults = (epochName, ntrodeName) => {
        this.selectNodeFromPath(`epochs/${epochName}/ntrodes/${ntrodeName}/processed_info/sorting_results`);
    }
    handleViewSortingResultsCurated = (epochName, ntrodeName) => {
        this.selectNodeFromPath(`epochs/${epochName}/ntrodes/${ntrodeName}/processed_info/sorting_results_curated`);
    }
    render() {
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
                    onViewSortingResults={this.handleViewSortingResults}
                    onViewSortingResultsCurated={this.handleViewSortingResultsCurated}
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
                    onViewSortingResults={this.props.onViewSortingResults}
                    onViewSortingResultsCurated={this.props.onViewSortingResultsCurated}
                    {...props}
                />
            );
        }
        else if (data.type === 'sorting_results') {
            return (
                <SortingResultsView
                    data={data}
                    reactopyaParent={this.props.reactopyaParent}
                    {...props}
                />
            )
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